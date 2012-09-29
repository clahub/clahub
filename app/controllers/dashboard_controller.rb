class DashboardController < ApplicationController
  def show
    if signed_in?
      render 'show'
    else
      render 'splash'
    end
  end
end
