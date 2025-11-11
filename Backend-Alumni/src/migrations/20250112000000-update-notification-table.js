'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the table exists and has old structure
    const tableDescription = await queryInterface.describeTable('Notification');
    
    // If old 'user-id' column exists, we need to migrate
    if (tableDescription['user-id']) {
      // Step 1: Add new columns if they don't exist
      if (!tableDescription['receiver-id']) {
        await queryInterface.addColumn('Notification', 'receiver-id', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporarily allow null for migration
          references: { model: 'User', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
      }
      
      if (!tableDescription['sender-id']) {
        await queryInterface.addColumn('Notification', 'sender-id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'User', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
      
      // Step 2: Create ENUM type for notification type if it doesn't exist
      try {
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_Notification_type" AS ENUM (
              'add_user',
              'accept_request',
              'added_to_group',
              'like',
              'comment',
              'reply',
              'edit_comment',
              'delete_comment',
              'message',
              'announcement',
              'role_update'
            );
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
      } catch (error) {
        // ENUM might already exist, continue
        console.log('ENUM type might already exist, continuing...');
      }
      
      // Step 3: Add type column if it doesn't exist
      if (!tableDescription['type']) {
        await queryInterface.addColumn('Notification', 'type', {
          type: Sequelize.ENUM(
            'add_user',
            'accept_request',
            'added_to_group',
            'like',
            'comment',
            'reply',
            'edit_comment',
            'delete_comment',
            'message',
            'announcement',
            'role_update'
          ),
          allowNull: true // Temporarily allow null
        });
      }
      
      // Step 4: Add message column if it doesn't exist
      if (!tableDescription['message']) {
        await queryInterface.addColumn('Notification', 'message', {
          type: Sequelize.STRING,
          allowNull: true // Temporarily allow null
        });
      }
      
      // Step 5: Migrate data from old structure to new structure
      // Copy user-id to receiver-id
      await queryInterface.sequelize.query(`
        UPDATE "Notification" 
        SET "receiver-id" = "user-id" 
        WHERE "receiver-id" IS NULL;
      `);
      
      // Copy content to message
      await queryInterface.sequelize.query(`
        UPDATE "Notification" 
        SET "message" = "content" 
        WHERE "message" IS NULL AND "content" IS NOT NULL;
      `);
      
      // Set default type for existing notifications
      await queryInterface.sequelize.query(`
        UPDATE "Notification" 
        SET "type" = 'announcement'::"enum_Notification_type"
        WHERE "type" IS NULL;
      `);
      
      // Step 6: Make new columns NOT NULL after data migration
      await queryInterface.changeColumn('Notification', 'receiver-id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      
      await queryInterface.changeColumn('Notification', 'type', {
        type: Sequelize.ENUM(
          'add_user',
          'accept_request',
          'added_to_group',
          'like',
          'comment',
          'reply',
          'edit_comment',
          'delete_comment',
          'message',
          'announcement',
          'role_update'
        ),
        allowNull: false
      });
      
      await queryInterface.changeColumn('Notification', 'message', {
        type: Sequelize.STRING,
        allowNull: false
      });
      
      // Step 7: Remove old columns
      // First, drop foreign key constraint on user-id if it exists
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "Notification" 
          DROP CONSTRAINT IF EXISTS "Notification_user-id_fkey";
        `);
      } catch (error) {
        // Constraint might not exist or have different name
        console.log('Could not drop old foreign key, continuing...');
      }
      
      // Drop old columns
      if (tableDescription['user-id']) {
        await queryInterface.removeColumn('Notification', 'user-id');
      }
      
      if (tableDescription['content']) {
        await queryInterface.removeColumn('Notification', 'content');
      }
    } else {
      // Table might have new structure already, just ensure all columns exist
      if (!tableDescription['receiver-id']) {
        await queryInterface.addColumn('Notification', 'receiver-id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'User', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
      }
      
      if (!tableDescription['sender-id']) {
        await queryInterface.addColumn('Notification', 'sender-id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'User', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
      
      // Create ENUM type
      try {
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_Notification_type" AS ENUM (
              'add_user',
              'accept_request',
              'added_to_group',
              'like',
              'comment',
              'reply',
              'edit_comment',
              'delete_comment',
              'message',
              'announcement',
              'role_update'
            );
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
      } catch (error) {
        console.log('ENUM type might already exist, continuing...');
      }
      
      if (!tableDescription['type']) {
        await queryInterface.addColumn('Notification', 'type', {
          type: Sequelize.ENUM(
            'add_user',
            'accept_request',
            'added_to_group',
            'like',
            'comment',
            'reply',
            'edit_comment',
            'delete_comment',
            'message',
            'announcement',
            'role_update'
          ),
          allowNull: false
        });
      }
      
      if (!tableDescription['message']) {
        await queryInterface.addColumn('Notification', 'message', {
          type: Sequelize.STRING,
          allowNull: false
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert migration - add back old columns
    const tableDescription = await queryInterface.describeTable('Notification');
    
    if (!tableDescription['user-id']) {
      await queryInterface.addColumn('Notification', 'user-id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      
      // Copy receiver-id to user-id
      await queryInterface.sequelize.query(`
        UPDATE "Notification" 
        SET "user-id" = "receiver-id";
      `);
      
      await queryInterface.changeColumn('Notification', 'user-id', {
        allowNull: false
      });
    }
    
    if (!tableDescription['content']) {
      await queryInterface.addColumn('Notification', 'content', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      // Copy message to content
      await queryInterface.sequelize.query(`
        UPDATE "Notification" 
        SET "content" = "message";
      `);
      
      await queryInterface.changeColumn('Notification', 'content', {
        allowNull: false
      });
    }
    
    // Remove new columns
    if (tableDescription['receiver-id']) {
      await queryInterface.removeColumn('Notification', 'receiver-id');
    }
    
    if (tableDescription['sender-id']) {
      await queryInterface.removeColumn('Notification', 'sender-id');
    }
    
    if (tableDescription['type']) {
      await queryInterface.removeColumn('Notification', 'type');
    }
    
    if (tableDescription['message']) {
      await queryInterface.removeColumn('Notification', 'message');
    }
  }
};

