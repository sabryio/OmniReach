//! Template renderer — merge-tag substitution.
//!
//! # Contract
//! Deep module: simple interface, complex substitution rules inside.
//!
//! Substitution precedence (highest to lowest):
//!   1. `contact.custom_fields[key]`
//!   2. `contact.name`  (for `{{name}}`)
//!   3. `contact.raw_phone` (for `{{phone}}`)
//!
//! A missing key is left as-is: `{{prescription}}` stays `{{prescription}}`
//! when the contact has no `prescription` in `custom_fields`. This matches
//! the TypeScript frontend behaviour exactly.
//!
//! # No I/O
//! Pure function — no database access, no network calls.

use crate::types::Contact;
use std::borrow::Cow;

/// Render `template` with substitutions drawn from `contact`.
///
/// Returns the rendered string. On unknown variables the placeholder is
/// preserved so operators can see what data is missing.
pub fn render(template: &str, contact: &Contact) -> String {
    // Simple linear scan — regex compilation is expensive; for MVP message
    // bodies are short and templates are rendered once per contact at campaign
    // creation time, so clarity beats micro-optimisation here.
    let mut result = String::with_capacity(template.len() + 64);
    let mut remaining = template;

    while let Some(open) = remaining.find("{{") {
        result.push_str(&remaining[..open]);
        remaining = &remaining[open + 2..];

        if let Some(close) = remaining.find("}}") {
            let key = remaining[..close].trim();
            remaining = &remaining[close + 2..];
            let value = resolve(key, contact);
            result.push_str(&value);
        } else {
            // Unclosed tag — emit verbatim and stop processing.
            result.push_str("{{");
            result.push_str(remaining);
            remaining = "";
        }
    }

    result.push_str(remaining);
    result
}

fn resolve<'a>(key: &str, contact: &'a Contact) -> Cow<'a, str> {
    // 1. Custom fields take highest precedence.
    if let Some(val) = contact.custom_fields.get(key) {
        return Cow::Borrowed(val.as_str());
    }
    // 2. Built-in fields.
    match key {
        "name" => Cow::Borrowed(contact.name.as_str()),
        "phone" => Cow::Borrowed(contact.raw_phone.as_str()),
        // 3. Unknown — preserve placeholder.
        _ => Cow::Owned(format!("{{{{{}}}}}", key)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Contact, ContactVerificationStatus};
    use std::collections::HashMap;
    use uuid::Uuid;

    fn contact_with(name: &str, custom: &[(&str, &str)]) -> Contact {
        let campaign_id = Uuid::new_v4();
        Contact {
            id: Uuid::new_v4(),
            campaign_id,
            name: name.to_string(),
            raw_phone: "+966501234567".to_string(),
            formatted_phone: "966501234567".to_string(),
            normalized_phone: "+966501234567".to_string(),
            custom_fields: custom
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect::<HashMap<_, _>>(),
            verification_status: ContactVerificationStatus::Unverified,
            verification_error: None,
            verified_at: None,
            wa_id: None,
        }
    }

    #[test]
    fn substitutes_name() {
        let c = contact_with("Ahmed", &[]);
        assert_eq!(render("Hello {{name}}!", &c), "Hello Ahmed!");
    }

    #[test]
    fn substitutes_custom_field() {
        let c = contact_with("Sara", &[("prescription", "Lipitor 20mg")]);
        assert_eq!(
            render("Your {{prescription}} is ready.", &c),
            "Your Lipitor 20mg is ready."
        );
    }

    #[test]
    fn custom_field_beats_builtin() {
        // If someone names a custom field "name" it overrides the contact.name.
        let c = contact_with("Ahmed", &[("name", "Dr. Ahmed")]);
        assert_eq!(render("Hello {{name}}", &c), "Hello Dr. Ahmed");
    }

    #[test]
    fn preserves_unknown_variable() {
        let c = contact_with("Ahmed", &[]);
        assert_eq!(
            render("Your {{prescription}} is ready.", &c),
            "Your {{prescription}} is ready."
        );
    }

    #[test]
    fn handles_unclosed_tag() {
        let c = contact_with("Ahmed", &[]);
        let out = render("Hello {{name", &c);
        assert!(out.contains("{{"));
    }

    #[test]
    fn substitutes_phone() {
        let c = contact_with("Ahmed", &[]);
        assert_eq!(render("Call {{phone}}", &c), "Call +966501234567");
    }
}
