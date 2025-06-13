(function($) {
    $(document).ready(function() {
        // Cache DOM elements
        var $categorySelect = $('#id_category');
        var $subcategorySelect = $('#id_subcategory');
        
        // Function to update subcategories
        function updateSubcategories() {
            var categoryId = $categorySelect.val();
            
            if (!categoryId) {
                // Clear subcategories if no category selected
                $subcategorySelect.empty().append('<option value="">---------</option>');
                return;
            }
            
            // Show loading
            $subcategorySelect.empty().append('<option value="">Loading...</option>');
            
            // Fetch subcategories for selected category
            $.ajax({
                url: '/api/subcategories/?category=' + categoryId,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    $subcategorySelect.empty().append('<option value="">---------</option>');
                    
                    // Add subcategory options
                    $.each(data, function(index, subcategory) {
                        $subcategorySelect.append(
                            $('<option></option>')
                                .attr('value', subcategory.id)
                                .text(subcategory.name)
                        );
                    });
                    
                    // Restore selected value if exists
                    if ($subcategorySelect.data('value')) {
                        $subcategorySelect.val($subcategorySelect.data('value'));
                    }
                },
                error: function() {
                    $subcategorySelect.empty().append('<option value="">Error loading subcategories</option>');
                }
            });
        }
        
        // Store initial subcategory value
        if ($subcategorySelect.val()) {
            $subcategorySelect.data('value', $subcategorySelect.val());
        }
        
        // Event handlers
        $categorySelect.on('change', updateSubcategories);
        
        // Initial load
        if ($categorySelect.val()) {
            updateSubcategories();
        }
        
        // Image preview functionality
        $('#id_image').on('change', function() {
            var input = this;
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                
                reader.onload = function(e) {
                    $('#image-preview').attr('src', e.target.result).show();
                };
                
                reader.readAsDataURL(input.files[0]);
            }
        });
    });
})(django.jQuery);