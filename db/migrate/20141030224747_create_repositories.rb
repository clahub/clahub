class CreateRepositories < ActiveRecord::Migration
  def change
    create_table :repositories do |t|
      t.references :agreement
      t.string :user_name
      t.string :repo_name
      t.integer :github_repo_hook_id

      t.timestamps
    end
  end
end
