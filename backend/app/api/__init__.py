from app.api import batch_calculations

def register_blueprints(app):
    app.register_blueprint(batch_calculations.bp, url_prefix='/api')
