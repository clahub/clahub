class AddNameAndToAgreements < ActiveRecord::Migration
  def change
    add_column :agreements, :name, :string
    add_column :agreements, :slug, :string
  end
end
