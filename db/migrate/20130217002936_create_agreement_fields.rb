class CreateAgreementFields < ActiveRecord::Migration
  def up
    create_table :agreement_fields do |t|
      t.integer :agreement_id
      t.integer :field_id
      t.timestamps
    end
    add_index :agreement_fields, [:agreement_id, :field_id]
  end

  def down
    remove_index :agreement_fields, :column => [:agreement_id, :field_id]
    drop_table :agreement_fields
  end
end
