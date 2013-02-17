class AgreementField < ActiveRecord::Base
  belongs_to :agreement
  belongs_to :field
  attr_accessible :field, :enabled
  validates :field_id, presence: true
  validates :agreement_id, presence: true

  def self.enabled
    where("enabled = TRUE")
  end
end
