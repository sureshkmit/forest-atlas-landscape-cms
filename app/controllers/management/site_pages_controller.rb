class Management::SitePagesController < ManagementController
  before_action :set_page, only: [:show, :edit, :update, :destroy]
  before_action :set_site, only: [:index, :new]

  # GET /management/:site_slug
  # GET /management/:site_slug.json
  def index
    @pages = SitePage.joins(:users)
               .where(users: {id: current_user.id})
               .where(sites: {slug: params[:site_slug]})
               .paginate(:page => params[:page], :per_page => params[:per_page])
               .order(params[:order] || 'created_at ASC')

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @pages }
    end
  end

  # GET /management/pages/1
  # GET /management/pages/1.json
  def show
  end

  # GET /management/pages/new
  def new
    @site_page = SitePage.new
  end

  # GET /management/pages/1/edit
  def edit
  end

  # POST /management/pages
  # POST /management/pages.json
  def create
    @site_page = SitePage.new(page_params)

    respond_to do |format|
      if @site_page.save
        format.html { redirect_to management_site_page_path(@site_page), notice: 'SitePage was successfully created.' }
        format.json { render :show, status: :created, location: @site_page }
      else
        format.html { render :new }
        format.json { render json: @site_page.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /management/pages/1
  # PATCH/PUT /management/pages/1.json
  def update
    respond_to do |format|
      if @site_page.update(page_params)
        format.html { redirect_to management_site_page_path(@site_page), notice: 'SitePage was successfully updated.' }
        format.json { render :show, status: :ok, location: @site_page }
      else
        format.html { render :edit }
        format.json { render json: @site_page.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /management/pages/1
  # DELETE /management/pages/1.json
  def destroy
    @site_page.destroy
    respond_to do |format|
      format.html { redirect_to pages_url, notice: 'SitePage was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_site
    @site = Site.find_by({slug: params[:site_slug]})
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_page
    @site_page = SitePage.find(params[:id])
    @site = @site_page.site
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def page_params
    params.require(:site_page).permit(:name, :description, :site_id, :uri, :content, :parent_id)
  end
end