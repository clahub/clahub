class CreateFields < ActiveRecord::Migration
  def up
    create_table :fields do |t|
      t.string :label
      t.string :data_type
      t.timestamps
    end
  end

  def down
    drop_table :fields
  end
end
