FactoryGirl.define do
  factory :agreement do
    association :user
    association :license
  end
end
