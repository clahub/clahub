class CreateUsers < ActiveRecord::Migration
  def up
    create_table :users do |t|
      t.integer :uid
      t.string :oauth_token
      t.string :nickname
      t.string :email
      t.string :name
      t.timestamps
    end

    add_index :users, :uid
  end

  def down
    remove_index :users, :column => :uid

    drop_table :users
  end
end
