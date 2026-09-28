from beanie import Document


_original_document_init = Document.__init__


def _safe_document_init(self, *args, **kwargs):
    """Allow standalone document creation in tests before Beanie is initialized."""
    super(Document, self).__init__(*args, **kwargs)
    if getattr(type(self), "_document_settings", None) is not None:
        self.get_motor_collection()


if Document.__init__ is not _safe_document_init:
    Document.__init__ = _safe_document_init
