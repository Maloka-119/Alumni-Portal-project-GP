"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. أولاً نغير الـ status ENUM قبل ما نضيف أي حاجة
    // لأن لو فيه rows قديمة، هتخرب
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      DROP CONSTRAINT IF EXISTS "DocumentRequest_status_check";
    `);

    // نعمل ENUM جديد
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

    // نغير الـ column type
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status TYPE "enum_DocumentRequest_status_new" 
      USING (
        CASE status
          WHEN 'in prograss' THEN 'pending'::"enum_DocumentRequest_status_new"
          ELSE 'completed'::"enum_DocumentRequest_status_new"
        END
      );
    `);

    // نحذف الـ ENUM القديم
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_DocumentRequest_status";
    `);

    // نعمل rename للـ ENUM الجديد
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_DocumentRequest_status_new" 
      RENAME TO "enum_DocumentRequest_status";
    `);

    // نعمل defaultValue للـ status
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);

    // 2. نضيف الحقول الجديدة
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

    // نستخدم TEXT بدل JSONB علشان مشاكل التوافق
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

    await queryInterface.addColumn(
      "DocumentRequest",
      "expected_completion_date",
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      "DocumentRequest",
      "actual_completion_date",
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    await queryInterface.addColumn("DocumentRequest", "updated_at", {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    });

    // 3. نعمل index لـ request_number لو محتاج
    await queryInterface.addIndex("DocumentRequest", ["request_number"], {
      name: "document_request_request_number_idx",
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // نحذف الـ index أولاً
    await queryInterface.removeIndex(
      "DocumentRequest",
      "document_request_request_number_idx"
    );

    // نحذف الحقول الجديدة
    await queryInterface.removeColumn("DocumentRequest", "request_number");
    await queryInterface.removeColumn("DocumentRequest", "language");
    await queryInterface.removeColumn("DocumentRequest", "attachments");
    await queryInterface.removeColumn("DocumentRequest", "national_id");
    await queryInterface.removeColumn("DocumentRequest", "notes");
    await queryInterface.removeColumn(
      "DocumentRequest",
      "expected_completion_date"
    );
    await queryInterface.removeColumn(
      "DocumentRequest",
      "actual_completion_date"
    );
    await queryInterface.removeColumn("DocumentRequest", "updated_at");

    // نرجع الـ status لـ ENUM القديم
    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      DROP CONSTRAINT IF EXISTS "DocumentRequest_status_check";
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_DocumentRequest_status_old" AS ENUM ('completed', 'in prograss');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "DocumentRequest" 
      ALTER COLUMN status TYPE "enum_DocumentRequest_status_old" 
      USING (
        CASE status
          WHEN 'completed' THEN 'completed'::"enum_DocumentRequest_status_old"
          ELSE 'in prograss'::"enum_DocumentRequest_status_old"
        END
      );
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_DocumentRequest_status";
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_DocumentRequest_status_old" 
      RENAME TO "enum_DocumentRequest_status";
    `);
  },
};
