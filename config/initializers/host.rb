HOST = ENV['HOST'] || {
  'development' => 'http://localhost:3000',
  'test'        => 'http://example.com',
  'production'  => 'http://clahub.com'
}[Rails.env]
