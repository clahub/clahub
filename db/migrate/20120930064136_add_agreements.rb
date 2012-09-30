class AddAgreements < ActiveRecord::Migration
  def up
    create_table :agreements do |t|
      t.integer :user_id
      t.integer :license_id
      t.timestamps
    end

    add_index :agreements, [:user_id, :license_id]
  end

  def down
    remove_index :agreements, :column => [:user_id, :license_id]

    drop_table :agreements
  end
end
