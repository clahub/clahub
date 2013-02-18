require 'spec_helper'

describe Field do
  it { should have_many :agreement_fields }
  it { should allow_mass_assignment_of(:label) }
  it { should allow_mass_assignment_of(:data_type) }
  it { should allow_mass_assignment_of(:enabled_by_default) }
  it { should allow_mass_assignment_of(:description) }
end
