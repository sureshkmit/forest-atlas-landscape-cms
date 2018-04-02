class Admin::MapVersionsController < AdminController
  before_action :set_user, only: :destroy

  def new
    @map_version = MapVersion.new
  end

  def create
    @map_version = MapVersion.new(user_params)

    if @map_version.save
      redirect_to admin_map_versions_path,
                  notice: 'Map version created'
    else
      render :new
    end
  end


  # GET /users
  # GET /users.json
  def index
    @map_versions = MapVersion.order(:position)

    gon.map_versions = @map_versions.map do |map|
      {
        'version' => {'value' => map.version, 'searchable' => true, 'sortable' => true},
        'position' => {'value' => map.position, 'searchable' => true, 'sortable' => true},
        'description' => {'value' => map.description, 'searchable' => true, 'sortable' => true},
        'edit' => {'value' => edit_admin_map_version_path(map)},
        'delete' => {'value' => admin_map_version_path(map), 'method' => 'delete'}
      }
    end

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @map_versions }
    end
  end

  # DELETE /users/1
  # DELETE /users/1.json
  def destroy
    @map_version.destroy
    respond_to do |format|
      format.html { redirect_to admin_map_versions_url, notice: 'Map version was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_user
    @map_version = MapVersion.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def user_params
    params.require(:map_version).permit(:version, :position, :description)
  end
end
