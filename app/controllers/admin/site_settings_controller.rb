class Admin::SiteSettingsController < AdminController

  before_action :set_site, only: [:show, :edit, :update, :destroy]
  before_action :set_settings, only: [:show, :edit, :update, :destroy]

  COLOR_CONTROLLER_ID = 'site_site_settings_attributes_4_value'
  COLOR_CONTROLLER_NAME = 'site[site_settings_attributes][4][value]'

  def index
  end

  def new
  end

  def edit
  end

  def create
    if @site.save
      redirect_to admin_site_user_path
      render :new
    end
  end

  def update
  end

  def show
    gon.colorControllerId = COLOR_CONTROLLER_ID
    gon.colorControllerName = COLOR_CONTROLLER_NAME
    gon.colorArray = @settings.where(name: 'flag').first[:value].split(' ').map{ |x| {color: x }}
    gon.colorArray = @settings.where(name: 'flag').first[:value].split(' ').map{ |x| {color: x }}
  end


  private
  def set_site
    @site = Site.find(params[:id])
  end

  def set_settings
    @settings = @site.get_ordered_settings
  end
end
