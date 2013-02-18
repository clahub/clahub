class AddEnabledFlagsOnFields < ActiveRecord::Migration
  def up
    add_column :fields, :enabled_by_default, :boolean, :null => false, :default => true
    add_column :agreement_fields, :enabled, :boolean, :null => false, :default => true
  end

  def down
    remove_column :agreement_fields, :enabled
    remove_column :fields, :enabled_by_default
  end
end
