class AddOtherRepoNamesToAgreements < ActiveRecord::Migration
  def change
    add_column :agreements, :other_repo_names, :string
  end
end
