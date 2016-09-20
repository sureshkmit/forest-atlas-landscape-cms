class Admin::SitesController < AdminController

  before_action :set_site, only: [:show, :edit, :update, :destroy]

  # GET /admin/sites
  # GET /admin/sites.json
  def index
    @sites = Site.paginate(:page => params[:page], :per_page => params[:per_page]).order(params[:order] || 'created_at ASC')

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @sites }
    end
  end

  # GET /admin/sites/1
  # GET /admin/sites/1.json
  def show
    respond_to do |format|
      format.html { render :show }
      format.json { render json: @site }
    end
  end

  # GET /admin/sites/new
  def new
    @site = Site.new
  end

  # GET /admin/sites/1/edit
  def edit
  end

  # POST /admin/sites
  # POST /admin/sites.json
  def create
    @site = Site.new(site_params)

    respond_to do |format|
      if @site.save
        format.html { redirect_to admin_site_path(@site), notice: 'Site was successfully created.' }
        format.json { render :show, status: :created, location: @site }
      else
        format.html { render :new }
        format.json { render json: @site.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /admin/sites/1
  # PATCH/PUT /admin/sites/1.json
  def update
    respond_to do |format|
      if @site.update(site_params)
        format.html { redirect_to admin_site_path(@site), notice: 'Site was successfully updated.' }
        format.json { render :show, status: :ok, location: @site }
      else
        format.html { render :edit }
        format.json { render json: @site.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/sites/1
  # DELETE /admin/sites/1.json
  def destroy
    @site.destroy
    respond_to do |format|
      format.html { redirect_to admin_sites_url, notice: 'Site was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_site
    @site = Site.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def site_params
    params.require(:site).permit(:name, :site_template_id, {user_ids: []})
  end
end