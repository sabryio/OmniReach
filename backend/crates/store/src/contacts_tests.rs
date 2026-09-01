//! Contacts store integration tests
//!
//! Tests verify the actual implemented functions:
//! - list_by_campaign, get_by_id
//! - update_verification

#[cfg(test)]
mod tests {
    use crate::{campaigns, contacts, db::Db};
    use omnireach_core::types::{
        ContactVerificationStatus, CreateCampaignInput, CreateContactInput,
    };
    use sqlx::SqlitePool;
    use std::collections::HashMap;
    use uuid::Uuid;

    async fn setup_test_db() -> Db {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory database");

        sqlx::migrate!("./src/migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        Db::from(pool)
    }

    fn create_test_contacts_input(count: usize) -> Vec<CreateContactInput> {
        (0..count)
            .map(|i| {
                let mut custom_fields = HashMap::new();
                custom_fields.insert("prescription".to_string(), format!("RX-{:04}", i));

                CreateContactInput {
                    name: format!("Patient {}", i),
                    raw_phone: format!("+20100000{:04}", i),
                    formatted_phone: format!("+20 100 000 {:04}", i),
                    normalized_phone: format!("20100000{:04}", i),
                    custom_fields,
                }
            })
            .collect()
    }

    // ──────────────────────────────────────────────────────────────────────
    // list_by_campaign
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_by_campaign_returns_all_contacts() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Test Campaign".to_string(),
            template_text: "Hello {{name}}".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(5),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contacts_list = contacts::list_by_campaign(&db, campaign.id).await.unwrap();

        assert_eq!(contacts_list.len(), 5);
        assert!(contacts_list.iter().all(|c| c.campaign_id == campaign.id));
    }

    #[tokio::test]
    async fn test_list_by_campaign_empty() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Empty Campaign".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contacts_list = contacts::list_by_campaign(&db, campaign.id).await.unwrap();

        assert_eq!(contacts_list.len(), 0);
    }

    #[tokio::test]
    async fn test_list_by_campaign_isolates_campaigns() {
        let db = setup_test_db().await;

        let input1 = CreateCampaignInput {
            title: "Campaign 1".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(3),
        };

        let input2 = CreateCampaignInput {
            title: "Campaign 2".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(2),
        };

        let campaign1 = campaigns::insert(&db, input1).await.unwrap();
        let campaign2 = campaigns::insert(&db, input2).await.unwrap();

        let contacts1 = contacts::list_by_campaign(&db, campaign1.id).await.unwrap();
        let contacts2 = contacts::list_by_campaign(&db, campaign2.id).await.unwrap();

        assert_eq!(contacts1.len(), 3);
        assert_eq!(contacts2.len(), 2);

        // Verify no overlap
        let ids1: Vec<Uuid> = contacts1.iter().map(|c| c.id).collect();
        let ids2: Vec<Uuid> = contacts2.iter().map(|c| c.id).collect();
        assert!(!ids1.iter().any(|id| ids2.contains(id)));
    }

    // ──────────────────────────────────────────────────────────────────────
    // get_by_id
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_get_by_id_returns_correct_contact() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Test Campaign".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(3),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact_id = campaign.contacts[1].id;

        let contact = contacts::get_by_id(&db, contact_id).await.unwrap();

        assert_eq!(contact.id, contact_id);
        assert_eq!(contact.name, "Patient 1");
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let db = setup_test_db().await;
        let fake_id = Uuid::new_v4();

        let result = contacts::get_by_id(&db, fake_id).await;

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            crate::StoreError::NotFound(_)
        ));
    }

    // ──────────────────────────────────────────────────────────────────────
    // update_verification
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_update_verification_to_registered() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Verification Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(1),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact_id = campaign.contacts[0].id;

        contacts::update_verification(
            &db,
            contact_id,
            ContactVerificationStatus::Registered,
            Some("201234567890@s.whatsapp.net".to_string()),
            None,
        )
        .await
        .unwrap();

        let updated = contacts::get_by_id(&db, contact_id).await.unwrap();

        assert_eq!(
            updated.verification_status,
            ContactVerificationStatus::Registered
        );
        assert!(updated.verified_at.is_some());
        assert_eq!(
            updated.wa_id,
            Some("201234567890@s.whatsapp.net".to_string())
        );
        assert!(updated.verification_error.is_none());
    }

    #[tokio::test]
    async fn test_update_verification_to_unregistered() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Unregistered Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(1),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact_id = campaign.contacts[0].id;

        contacts::update_verification(
            &db,
            contact_id,
            ContactVerificationStatus::Unregistered,
            None,
            None,
        )
        .await
        .unwrap();

        let updated = contacts::get_by_id(&db, contact_id).await.unwrap();

        assert_eq!(
            updated.verification_status,
            ContactVerificationStatus::Unregistered
        );
        assert!(updated.verified_at.is_some());
        assert!(updated.wa_id.is_none());
    }

    #[tokio::test]
    async fn test_update_verification_with_error() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Error Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(1),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact_id = campaign.contacts[0].id;

        contacts::update_verification(
            &db,
            contact_id,
            ContactVerificationStatus::Error,
            None,
            Some("Network timeout".to_string()),
        )
        .await
        .unwrap();

        let updated = contacts::get_by_id(&db, contact_id).await.unwrap();

        assert_eq!(
            updated.verification_status,
            ContactVerificationStatus::Error
        );
        assert_eq!(
            updated.verification_error,
            Some("Network timeout".to_string())
        );
    }

    #[tokio::test]
    async fn test_all_verification_statuses() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "All Statuses Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(5),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        let statuses = [
            ContactVerificationStatus::Unverified,
            ContactVerificationStatus::Checking,
            ContactVerificationStatus::Registered,
            ContactVerificationStatus::Unregistered,
            ContactVerificationStatus::Error,
        ];

        for (i, status) in statuses.iter().enumerate() {
            let contact_id = campaign.contacts[i].id;
            let error = if status == &ContactVerificationStatus::Error {
                Some("Test error".to_string())
            } else {
                None
            };

            contacts::update_verification(&db, contact_id, status.clone(), error, None)
                .await
                .unwrap();

            let updated = contacts::get_by_id(&db, contact_id).await.unwrap();
            assert_eq!(updated.verification_status, *status);
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Data Integrity
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_custom_fields_json_round_trip() {
        let db = setup_test_db().await;

        let mut custom_fields = HashMap::new();
        custom_fields.insert("prescription".to_string(), "RX-12345".to_string());
        custom_fields.insert("notes".to_string(), "مريض منتظم".to_string());

        let input = CreateCampaignInput {
            title: "Custom Fields Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![CreateContactInput {
                name: "Test Patient".to_string(),
                raw_phone: "+201234567890".to_string(),
                formatted_phone: "+20 123 456 7890".to_string(),
                normalized_phone: "201234567890".to_string(),
                custom_fields: custom_fields.clone(),
            }],
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact = &campaign.contacts[0];

        assert_eq!(contact.custom_fields.len(), 2);
        assert_eq!(
            contact.custom_fields.get("prescription"),
            Some(&"RX-12345".to_string())
        );
        assert_eq!(
            contact.custom_fields.get("notes"),
            Some(&"مريض منتظم".to_string())
        );
    }

    #[tokio::test]
    async fn test_phone_fields_preserved() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Phone Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![CreateContactInput {
                name: "Phone Test".to_string(),
                raw_phone: "+20 (100) 000-1234".to_string(),
                formatted_phone: "+20 100 000 1234".to_string(),
                normalized_phone: "201000001234".to_string(),
                custom_fields: HashMap::new(),
            }],
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact = &campaign.contacts[0];

        assert_eq!(contact.raw_phone, "+20 (100) 000-1234");
        assert_eq!(contact.formatted_phone, "+20 100 000 1234");
        assert_eq!(contact.normalized_phone, "201000001234");
    }

    #[tokio::test]
    async fn test_unicode_in_contact_name() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Unicode Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![CreateContactInput {
                name: "أحمد محمد علي 🏥".to_string(),
                raw_phone: "+201234567890".to_string(),
                formatted_phone: "+20 123 456 7890".to_string(),
                normalized_phone: "201234567890".to_string(),
                custom_fields: HashMap::new(),
            }],
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        let contact = &campaign.contacts[0];

        assert_eq!(contact.name, "أحمد محمد علي 🏥");
    }

    #[tokio::test]
    async fn test_contacts_cascade_delete_with_campaign() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Cascade Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts_input(3),
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        // Verify contacts exist
        let before = contacts::list_by_campaign(&db, campaign.id).await.unwrap();
        assert_eq!(before.len(), 3);

        // Delete campaign
        sqlx::query!(
            "DELETE FROM campaigns WHERE id = ?",
            campaign.id.to_string()
        )
        .execute(db.pool())
        .await
        .unwrap();

        // Verify contacts are deleted
        let after = contacts::list_by_campaign(&db, campaign.id).await.unwrap();
        assert_eq!(after.len(), 0);
    }
}
