Clahub::Application.routes.draw do
  root to: "dashboard#show", :as => :dashboard
  match 'auth/github/callback' => 'github_oauth#callback', :as => :github_oauth_callback
  match 'sign_out' => 'sessions#destroy', :as => :sign_out
end
