FactoryGirl.define do
  factory :agreement do
    association :user
    sequence(:repo_name) { |n| "repo_name#{n}" }
    user_name { user.nickname }
    text "Generic CLA text"
  end
end
