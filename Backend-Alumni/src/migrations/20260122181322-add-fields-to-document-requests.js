"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status DROP DEFAULT;
    `);

   
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      DROP CONSTRAINT IF EXISTS "DocumentRequest_status_check";
    `);

    
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_DocumentRequest_status_new";
    `);

   
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_DocumentRequest_status_new" AS ENUM (
        'pending',
        'under_review', 
        'approved',
        'ready_for_pickup',
        'completed',
        'cancelled'
      );
    `);

   
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status TYPE "enum_DocumentRequest_status_new" 
      USING (
        CASE status::text
          WHEN 'in prograss' THEN 'pending'::"enum_DocumentRequest_status_new"
          WHEN 'completed' THEN 'completed'::"enum_DocumentRequest_status_new"
          ELSE 'pending'::"enum_DocumentRequest_status_new"
        END
      );
    `);

   
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_DocumentRequest_status";
    `);

 
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_DocumentRequest_status_new" 
      RENAME TO "enum_DocumentRequest_status";
    `);

    
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);

    await queryInterface.addColumn("DocumentRequest", "request_number", {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });

    await queryInterface.addColumn("DocumentRequest", "language", {
      type: Sequelize.ENUM("ar", "en"),
      defaultValue: "ar",
      allowNull: false,
    });

    await queryInterface.addColumn("DocumentRequest", "attachments", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "JSON string array of attachment URLs",
    });

    await queryInterface.addColumn("DocumentRequest", "national_id", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "",
    });

    await queryInterface.addColumn("DocumentRequest", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("DocumentRequest", "expected_completion_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("DocumentRequest", "actual_completion_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("DocumentRequest", "updated_at", {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    });

   
    await queryInterface.addIndex("DocumentRequest", ["request_number"], {
      name: "document_request_request_number_idx",
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
   
    await queryInterface.removeIndex("DocumentRequest", "document_request_request_number_idx");

  
    const columns = [
      "request_number", "language", "attachments", 
      "national_id", "notes", "expected_completion_date", 
      "actual_completion_date", "updated_at"
    ];
    
    for (const column of columns) {
      await queryInterface.removeColumn("DocumentRequest", column);
    }

    
    await queryInterface.sequelize.query('ALTER TABLE "DocumentRequest" ALTER COLUMN status DROP DEFAULT;');
    
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DocumentRequest_status_old";');
    
    await queryInterface.sequelize.query('CREATE TYPE "enum_DocumentRequest_status_old" AS ENUM (\'completed\', \'in prograss\');');

    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status TYPE "enum_DocumentRequest_status_old" 
      USING (
        CASE status::text
          WHEN 'completed' THEN 'completed'::"enum_DocumentRequest_status_old"
          ELSE 'in prograss'::"enum_DocumentRequest_status_old"
        END
      );
    `);

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DocumentRequest_status";');
    await queryInterface.sequelize.query('ALTER TYPE "enum_DocumentRequest_status_old" RENAME TO "enum_DocumentRequest_status";');
    await queryInterface.sequelize.query('ALTER TABLE "DocumentRequest" ALTER COLUMN status SET DEFAULT \'in prograss\';');
  },
};