Clahub::Application.routes.draw do
  root to: "dashboard#show", :as => :dashboard
  match 'auth/github/callback' => 'github_oauth#callback', :as => :github_oauth_callback
  match 'sign_out' => 'sessions#destroy', :as => :sign_out

  resources :repos, only: [:index]
  resources :licenses, only: [:new, :create]

  constraints :repo_name => /[^\/]+/ do
    get 'licenses/:user_name/:repo_name' => 'licenses#show', :as => :license
    post 'licenses/:user_name/:repo_name/agreements' => 'agreements#create', :as => :license_agreement
  end

  post 'repo_hook' => 'github_webhooks#repo_hook'
end
