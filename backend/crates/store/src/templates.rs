//! Template repository — all operations for the `templates` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{CreateTemplateInput, Template, UpdateTemplateInput};
use uuid::Uuid;

/// GET /api/templates — return all templates
///
/// TODO: Phase 2 — implement real SQL query
/// For now, returns hardcoded mock data to verify type parity with frontend.
pub async fn list_all(_db: &Db) -> Result<Vec<Template>, StoreError> {
    let now = Utc::now();
    let mock_templates = vec![
        Template {
            id: Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap(),
            title: "Prescription Ready for Pickup".to_string(),
            title_ar: None,
            category: "Pharmacy".to_string(),
            category_ar: None,
            text: "Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy. Please bring your ID.".to_string(),
            text_ar: None,
            image_url: Some("https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80".to_string()),
            image_file_name: Some("prescription_ready.jpg".to_string()),
            suggested_variables: vec!["name".to_string(), "prescription".to_string()],
            created_at: now - chrono::Duration::days(30),
            updated_at: now - chrono::Duration::days(30),
        },
        Template {
            id: Uuid::parse_str("22222222-2222-2222-2222-222222222222").unwrap(),
            title: "Lab Results Available".to_string(),
            title_ar: None,
            category: "Lab Results".to_string(),
            category_ar: None,
            text: "Dear {{name}}, your lab results are now available. Please visit us during business hours or log into the patient portal at {{portal_url}}.".to_string(),
            text_ar: None,
            image_url: Some("https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80".to_string()),
            image_file_name: Some("lab_results.jpg".to_string()),
            suggested_variables: vec!["name".to_string(), "portal_url".to_string()],
            created_at: now - chrono::Duration::days(25),
            updated_at: now - chrono::Duration::days(25),
        },
        Template {
            id: Uuid::parse_str("33333333-3333-3333-3333-333333333333").unwrap(),
            title: "Flu Vaccine Reminder".to_string(),
            title_ar: None,
            category: "Vaccination".to_string(),
            category_ar: None,
            text: "Hi {{name}}, flu season is here! Protect yourself and your family with our flu vaccine. Book your appointment today at {{pharmacy}}.".to_string(),
            text_ar: None,
            image_url: Some("https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80".to_string()),
            image_file_name: Some("flu_vaccine.jpg".to_string()),
            suggested_variables: vec!["name".to_string(), "pharmacy".to_string()],
            created_at: now - chrono::Duration::days(20),
            updated_at: now - chrono::Duration::days(20),
        },
        Template {
            id: Uuid::parse_str("44444444-4444-4444-4444-444444444444").unwrap(),
            title: "VIP Membership Benefits".to_string(),
            title_ar: None,
            category: "VIP Care".to_string(),
            category_ar: None,
            text: "Exclusive offer for {{name}}! As a VIP member, enjoy 20% off all purchases this month. Visit us at {{pharmacy}} to claim your rewards.".to_string(),
            text_ar: None,
            image_url: Some("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80".to_string()),
            image_file_name: Some("vip_benefits.jpg".to_string()),
            suggested_variables: vec!["name".to_string(), "pharmacy".to_string()],
            created_at: now - chrono::Duration::days(15),
            updated_at: now - chrono::Duration::days(15),
        },
        Template {
            id: Uuid::parse_str("55555555-5555-5555-5555-555555555555").unwrap(),
            title: "Refill Reminder".to_string(),
            title_ar: None,
            category: "Refill Reminder".to_string(),
            category_ar: None,
            text: "Hello {{name}}, it's time to refill your {{prescription}}. Call us or order online for convenient pickup or delivery.".to_string(),
            text_ar: None,
            image_url: None,
            image_file_name: None,
            suggested_variables: vec!["name".to_string(), "prescription".to_string()],
            created_at: now - chrono::Duration::days(10),
            updated_at: now - chrono::Duration::days(10),
        },
    ];
    Ok(mock_templates)
}

/// GET /api/templates/:id — return single template by ID
///
/// TODO: Phase 2 — implement real SQL query
pub async fn get_by_id(_db: &Db, id: Uuid) -> Result<Template, StoreError> {
    let templates = list_all(_db).await?;
    templates
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| StoreError::NotFound(format!("Template {} not found", id)))
}

/// POST /api/templates — create new template
///
/// TODO: Phase 2 — implement real SQL INSERT
pub async fn insert(_db: &Db, input: CreateTemplateInput) -> Result<Template, StoreError> {
    let now = Utc::now();
    let new_template = Template {
        id: Uuid::new_v4(),
        title: input.title,
        title_ar: input.title_ar,
        category: input.category,
        category_ar: input.category_ar,
        text: input.text,
        text_ar: input.text_ar,
        image_url: input.image_url,
        image_file_name: input.image_file_name,
        suggested_variables: input.suggested_variables,
        created_at: now,
        updated_at: now,
    };
    Ok(new_template)
}

/// PATCH /api/templates/:id — update template
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn update(
    _db: &Db,
    id: Uuid,
    input: UpdateTemplateInput,
) -> Result<Template, StoreError> {
    let mut template = get_by_id(_db, id).await?;

    if let Some(title) = input.title {
        template.title = title;
    }
    if let Some(title_ar) = input.title_ar {
        template.title_ar = Some(title_ar);
    }
    if let Some(category) = input.category {
        template.category = category;
    }
    if let Some(category_ar) = input.category_ar {
        template.category_ar = Some(category_ar);
    }
    if let Some(text) = input.text {
        template.text = text;
    }
    if let Some(text_ar) = input.text_ar {
        template.text_ar = Some(text_ar);
    }
    if let Some(image_url) = input.image_url {
        template.image_url = Some(image_url);
    }
    if let Some(image_file_name) = input.image_file_name {
        template.image_file_name = Some(image_file_name);
    }
    if let Some(suggested_variables) = input.suggested_variables {
        template.suggested_variables = suggested_variables;
    }

    template.updated_at = Utc::now();
    Ok(template)
}

/// DELETE /api/templates/:id
///
/// TODO: Phase 2 — implement real SQL DELETE
pub async fn delete(_db: &Db, id: Uuid) -> Result<(), StoreError> {
    // Verify template exists
    let _ = get_by_id(_db, id).await?;
    // TODO: DELETE FROM templates WHERE id = ?
    Ok(())
}
