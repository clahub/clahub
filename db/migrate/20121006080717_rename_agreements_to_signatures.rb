class RenameAgreementsToSignatures < ActiveRecord::Migration
  def up
    rename_table :agreements, :signatures
  end

  def down
    rename_table :signatures, :agreements
  end
end
