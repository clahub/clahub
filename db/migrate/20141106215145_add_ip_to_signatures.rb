class AddIpToSignatures < ActiveRecord::Migration
  def change
    add_column :signatures, :ip, :inet
  end
end
