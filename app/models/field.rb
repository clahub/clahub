class Field < ActiveRecord::Base
  has_many :agreement_fields
  attr_accessible :label, :data_type, :enabled_by_default
end
