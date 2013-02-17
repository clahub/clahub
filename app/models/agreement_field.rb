class AgreementField < ActiveRecord::Base
  belongs_to :agreement
  belongs_to :field
end
