class AddFieldDescription < ActiveRecord::Migration
  def up
    add_column :fields, :description, :text
  end

  def down
    remove_column :fields, :description
  end
end
