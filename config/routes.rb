Clahub::Application.routes.draw do
  root to: "dashboard#show"
  match 'auth/github/callback' => 'github_oauth#callback', :as => :github_oauth_callback
end
