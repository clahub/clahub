class CreateFieldEntriesUnderSignatures < ActiveRecord::Migration
  def up
    create_table :field_entries do |t|
      t.integer :signature_id
      t.integer :agreement_field_id
      t.text :value
    end
    add_index :field_entries, [:signature_id, :agreement_field_id]
  end

  def down
    remove_index :field_entries, :column => [:signature_id, :agreement_field_id]
    drop_table :field_entries
  end
end
