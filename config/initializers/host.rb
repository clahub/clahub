development_host = if Rails.env.development?
  port = ENV['PORT'] || 3000
  if ENV['START_LOCALTUNNEL']
    tunnel = LocalTunnel::Tunnel.new(port, nil)
    response = tunnel.register_tunnel

    "http://#{response['host']}".tap do |localtunnel_host|
      `echo #{localtunnel_host} > .localtunnel_host`
      Rails.logger.info("Wrote to .localtunnel_host #{localtunnel_host}")
      Process.detach fork { tunnel.start_tunnel }
    end
  elsif ENV['READ_LOCALTUNNEL']
    `cat .localtunnel_host`.strip.tap do |localtunnel_host|
      Rails.logger.info("Read from .localtunnel_host #{localtunnel_host}")
    end
  else
    "http://localhost:#{port}"
  end
end

HOST = ENV['HOST'] || {
  'development' => development_host,
  'test'        => 'http://example.com',
  'production'  => 'http://clahub.com'
}[Rails.env]

