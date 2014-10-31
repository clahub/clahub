FactoryGirl.define do
  factory :repository do
    association :agreement
    sequence(:repo_name) { |n| "repo_name#{n}" }
    user_name { agreement.user.nickname }
  end
end
