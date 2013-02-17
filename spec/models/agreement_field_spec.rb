require 'spec_helper'

describe AgreementField do
  it { should belong_to :field }
  it { should belong_to :agreement }
end
