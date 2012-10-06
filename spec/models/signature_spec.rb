require 'spec_helper'

describe Signature do
  it { should belong_to :user }
  it { should belong_to :agreement }

  it { should validate_presence_of :user_id }
  it { should validate_presence_of :agreement_id }

  it { should allow_mass_assignment_of(:user) }
  it { should allow_mass_assignment_of(:agreement) }
end
