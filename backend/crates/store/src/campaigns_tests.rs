//! Campaigns store integration tests
//!
//! Tests verify actual implemented functions:
//! - list_all, get_by_id, insert, delete
//! - update_status, increment_counter, set_archived

#[cfg(test)]
mod tests {
    use crate::campaigns::CounterField;
    use crate::{campaigns, db::Db};
    use omnireach_core::types::{CampaignStatus, CreateCampaignInput, CreateContactInput};
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

    fn create_test_contacts(count: usize) -> Vec<CreateContactInput> {
        (0..count)
            .map(|i| CreateContactInput {
                name: format!("Contact {}", i),
                raw_phone: format!("+20100000{:04}", i),
                formatted_phone: format!("+20 100 000 {:04}", i),
                normalized_phone: format!("20100000{:04}", i),
                custom_fields: HashMap::new(),
                verification_status: None,
                wa_id: None,
            })
            .collect()
    }

    fn create_test_campaign_input(
        title: &str,
        template_text: &str,
        contacts: Vec<CreateContactInput>,
    ) -> CreateCampaignInput {
        CreateCampaignInput {
            title: title.to_string(),
            template_text: template_text.to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts,
            status: None,
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // insert (transactional with contacts)
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_insert_campaign_with_contacts() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Test Campaign".to_string(),
            template_text: "Hello {{name}}".to_string(),
            image_url: Some("https://example.com/image.png".to_string()),
            session_ids: vec![Uuid::new_v4()],
            contacts: create_test_contacts(3),
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        assert_eq!(campaign.title, "Test Campaign");
        assert_eq!(campaign.status, CampaignStatus::Draft);
        assert_eq!(campaign.total_contacts, 3);
        assert_eq!(campaign.contacts.len(), 3);
    }

    #[tokio::test]
    async fn test_insert_campaign_without_contacts() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Empty Campaign".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        assert_eq!(campaign.total_contacts, 0);
        assert_eq!(campaign.contacts.len(), 0);
    }

    // ──────────────────────────────────────────────────────────────────────
    // list_all (with embedded contacts via JOIN/HashMap)
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_all_returns_campaigns_with_contacts() {
        let db = setup_test_db().await;

        for i in 0..3 {
            let input = CreateCampaignInput {
                title: format!("Campaign {}", i),
                template_text: "Test".to_string(),
                image_url: None,
                session_ids: vec![],
                media_ref: None,
                contacts: create_test_contacts(2),
                ..Default::default()
            };
            campaigns::insert(&db, input).await.unwrap();
        }

        let all = campaigns::list_all(&db).await.unwrap();

        assert_eq!(all.len(), 3);
        assert!(all.iter().all(|c| c.contacts.len() == 2));
    }

    #[tokio::test]
    async fn test_list_all_orders_by_created_at_desc() {
        let db = setup_test_db().await;

        let mut ids = vec![];
        for i in 0..3 {
            let input = CreateCampaignInput {
                title: format!("Campaign {}", i),
                template_text: "Test".to_string(),
                image_url: None,
                session_ids: vec![],
                media_ref: None,
                contacts: vec![],
                ..Default::default()
            };
            let campaign = campaigns::insert(&db, input).await.unwrap();
            ids.push(campaign.id);
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }

        let all = campaigns::list_all(&db).await.unwrap();

        // Most recent first
        assert_eq!(all[0].id, ids[2]);
        assert_eq!(all[1].id, ids[1]);
        assert_eq!(all[2].id, ids[0]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // get_by_id
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_get_by_id_returns_campaign_with_contacts() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Single Campaign".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts(5),
            ..Default::default()
        };

        let inserted = campaigns::insert(&db, input).await.unwrap();
        let retrieved = campaigns::get_by_id(&db, inserted.id).await.unwrap();

        assert_eq!(retrieved.id, inserted.id);
        assert_eq!(retrieved.title, "Single Campaign");
        assert_eq!(retrieved.contacts.len(), 5);
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let db = setup_test_db().await;
        let fake_id = Uuid::new_v4();

        let result = campaigns::get_by_id(&db, fake_id).await;

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            crate::StoreError::NotFound(_)
        ));
    }

    // ──────────────────────────────────────────────────────────────────────
    // update_status (with timestamp management)
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_update_status_to_running_sets_started_at() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Status Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();
        assert!(campaign.started_at.is_none());

        let updated = campaigns::update_status(&db, campaign.id, CampaignStatus::Running)
            .await
            .unwrap();

        assert_eq!(updated.status, CampaignStatus::Running);
        assert!(updated.started_at.is_some());
    }

    #[tokio::test]
    async fn test_update_status_to_completed_sets_completed_at() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Completion Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        let completed = campaigns::update_status(&db, campaign.id, CampaignStatus::Completed)
            .await
            .unwrap();

        assert_eq!(completed.status, CampaignStatus::Completed);
        assert!(completed.completed_at.is_some());
    }

    // ──────────────────────────────────────────────────────────────────────
    // increment_counter
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_increment_sent_count() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Counter Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        campaigns::increment_counter(&db, campaign.id, CounterField::Sent)
            .await
            .unwrap();
        campaigns::increment_counter(&db, campaign.id, CounterField::Sent)
            .await
            .unwrap();

        let updated = campaigns::get_by_id(&db, campaign.id).await.unwrap();
        assert_eq!(updated.sent_count, 2);
    }

    #[tokio::test]
    async fn test_increment_failed_count() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Failed Counter Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        campaigns::increment_counter(&db, campaign.id, CounterField::Failed)
            .await
            .unwrap();

        let updated = campaigns::get_by_id(&db, campaign.id).await.unwrap();
        assert_eq!(updated.failed_count, 1);
    }

    // ──────────────────────────────────────────────────────────────────────
    // set_archived
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_set_archived_true() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Archive Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        let archived = campaigns::set_archived(&db, campaign.id, true)
            .await
            .unwrap();

        assert!(archived.is_archived);
        assert!(archived.archived_at.is_some());
    }

    #[tokio::test]
    async fn test_set_archived_false() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Unarchive Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        // Archive first
        campaigns::set_archived(&db, campaign.id, true)
            .await
            .unwrap();

        // Then unarchive
        let unarchived = campaigns::set_archived(&db, campaign.id, false)
            .await
            .unwrap();

        assert!(!unarchived.is_archived);
        assert!(unarchived.archived_at.is_none());
    }

    // ──────────────────────────────────────────────────────────────────────
    // delete
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_delete_campaign() {
        let db = setup_test_db().await;

        let input = CreateCampaignInput {
            title: "Delete Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        campaigns::delete(&db, campaign.id).await.unwrap();

        let result = campaigns::get_by_id(&db, campaign.id).await;
        assert!(result.is_err());
    }

    // ──────────────────────────────────────────────────────────────────────
    // Data Integrity
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_session_ids_json_round_trip() {
        let db = setup_test_db().await;

        let session1 = Uuid::new_v4();
        let session2 = Uuid::new_v4();

        let input = CreateCampaignInput {
            title: "Session IDs Test".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![session1, session2],
            media_ref: None,
            contacts: vec![],
            ..Default::default()
        };

        let campaign = campaigns::insert(&db, input).await.unwrap();

        assert_eq!(campaign.session_ids.len(), 2);
        assert!(campaign.session_ids.contains(&session1));
        assert!(campaign.session_ids.contains(&session2));
    }

    #[tokio::test]
    async fn test_contacts_grouped_correctly_per_campaign() {
        let db = setup_test_db().await;

        let input1 = CreateCampaignInput {
            title: "Campaign 1".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts(3),
            ..Default::default()
        };

        let input2 = CreateCampaignInput {
            title: "Campaign 2".to_string(),
            template_text: "Test".to_string(),
            image_url: None,
            session_ids: vec![],
            media_ref: None,
            contacts: create_test_contacts(5),
            ..Default::default()
        };

        let campaign1 = campaigns::insert(&db, input1).await.unwrap();
        let campaign2 = campaigns::insert(&db, input2).await.unwrap();

        let all = campaigns::list_all(&db).await.unwrap();

        let c1 = all.iter().find(|c| c.id == campaign1.id).unwrap();
        let c2 = all.iter().find(|c| c.id == campaign2.id).unwrap();

        assert_eq!(c1.contacts.len(), 3);
        assert_eq!(c2.contacts.len(), 5);

        assert!(c1.contacts.iter().all(|ct| ct.campaign_id == campaign1.id));
        assert!(c2.contacts.iter().all(|ct| ct.campaign_id == campaign2.id));
    }
}
