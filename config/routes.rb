Clahub::Application.routes.draw do
  root to: "pages#home", :as => :home
  match "/pages/*id" => 'pages#show', as: :page, format: false

  match 'auth/github/callback' => 'github_oauth#callback', :as => :github_oauth_callback
  match 'auth/failure' => 'github_oauth#failure'
  match 'sign_out' => 'sessions#destroy', :as => :sign_out

  resources :repos, only: [:index]
  resources :agreements, only: [:index, :new, :create]

  get 'agreements/:id.csv' => 'agreements#show', :as => :agreement, :format => :csv
  get 'agreements/:id' => 'agreements#show', :as => :agreement
  post 'agreements/:id/signatures' => 'signatures#create', :as => :agreement_signature

  post 'repo_hook' => 'github_webhooks#repo_hook'

  resource :markdown_preview
end
