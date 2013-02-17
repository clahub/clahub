class AgreementField < ActiveRecord::Base
  belongs_to :agreement
  belongs_to :field
  attr_accessible :field, :enabled, :agreement
  validates :field_id, presence: true
  validates :agreement, presence: true

  def self.enabled
    where("enabled = TRUE")
  end
end
