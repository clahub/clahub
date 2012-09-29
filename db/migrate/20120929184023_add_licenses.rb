class AddLicenses < ActiveRecord::Migration
  def up
    create_table :licenses do |t|
      t.string :user_name
      t.string :repo_name
      t.text :text
      t.integer :user_id
      t.timestamps
    end

    add_index :licenses, [:user_name, :repo_name]
    add_index :licenses, :user_id
  end

  def down
    remove_index :licenses, :column => :user_id
    remove_index :licenses, :column => [:user_name, :repo_name]

    drop_table :licenses
  end
end
