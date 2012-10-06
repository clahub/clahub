class RenameLicensesToAgreements < ActiveRecord::Migration
  def up
    rename_table :licenses, :agreements
    rename_column :signatures, :license_id, :agreement_id
  end

  def down
    rename_column :signatures, :agreement_id, :license_id
    rename_table :agreements, :licenses
  end
end
