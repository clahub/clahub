require 'spec_helper'

describe AgreementField do
  it { should belong_to :field }
  it { should belong_to :agreement }
  it { should allow_mass_assignment_of(:field) }
  it { should allow_mass_assignment_of(:enabled) }
  it { should allow_mass_assignment_of(:agreement) }
  it { should validate_presence_of :field_id }
  it { should validate_presence_of :agreement }
end
