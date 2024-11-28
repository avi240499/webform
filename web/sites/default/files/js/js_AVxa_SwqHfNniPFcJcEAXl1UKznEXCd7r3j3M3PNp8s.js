/**
 * @file
 * JavaScript behaviors for Select2 integration.
 */

(function ($, Drupal, once) {

  'use strict';

  // @see https://select2.github.io/options.html
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.select2 = Drupal.webform.select2 || {};
  Drupal.webform.select2.options = Drupal.webform.select2.options || {};
  Drupal.webform.select2.options.width = Drupal.webform.select2.options.width || '100%';
  Drupal.webform.select2.options.widthInline = Drupal.webform.select2.options.widthInline || '50%';

  /**
   * Initialize Select2 support.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformSelect2 = {
    attach: function (context) {
      if (!$.fn.select2) {
        return;
      }

      $(once('webform-select2', 'select.js-webform-select2, .js-webform-select2 select', context))
        .each(function () {
          var $select = $(this);

          var options = {};
          if ($select.parents('.webform-element--title-inline').length) {
            options.width = Drupal.webform.select2.options.widthInline;
          }
          options = $.extend(options, Drupal.webform.select2.options);
          if ($select.data('placeholder')) {
            options.placeholder = $select.data('placeholder');
            if (!$select.prop('multiple')) {
              // Allow single option to be deselected.
              options.allowClear = true;
            }
          }
          if ($select.data('limit')) {
            options.maximumSelectionLength = $select.data('limit');
          }

          // Remove required attribute from IE11 which breaks
          // HTML5 clientside validation.
          // @see https://github.com/select2/select2/issues/5114
          if (window.navigator.userAgent.indexOf('Trident/') !== -1
            && $select.attr('multiple')
            && $select.attr('required')) {
            $select.removeAttr('required');
          }

          $select.select2(options);
        });

    }
  };

  /**
   * ISSUE:
   * Hiding/showing element via #states API cause select2 dropdown to appear in the wrong position.
   *
   * WORKAROUND:
   * Close (aka hide) select2 dropdown when #states API hides or shows an element.
   *
   * Steps to reproduce:
   * - Add custom 'Submit button(s)'
   * - Hide submit button
   * - Save
   * - Open 'Submit button(s)' dialog
   *
   * Dropdown body is positioned incorrectly when dropdownParent isn't statically positioned.
   * @see https://github.com/select2/select2/issues/3303
   */
  $(function () {
    if ($.fn.select2) {
      $(document).on('state:visible state:visible-slide', function (e) {
        $('select.select2-hidden-accessible').select2('close');
      });
    }

    // Select2 search broken inside jQuery UI 1.10.x modal Dialog.
    // @see https://github.com/select2/select2/issues/1246
    if ($.ui && $.ui.dialog && $.ui.dialog.prototype._allowInteraction) {
      var ui_dialog_interaction = $.ui.dialog.prototype._allowInteraction;
      $.ui.dialog.prototype._allowInteraction = function (e) {
        if ($(e.target).closest('.select2-dropdown').length) {
          return true;
        }
        return ui_dialog_interaction.apply(this, arguments);
      };
    }
  });

})(jQuery, Drupal,  once);
;
/**
 * @file
 * JavaScript behaviors for select menu.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Disable select menu options using JavaScript.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformSelectOptionsDisabled = {
    attach: function (context) {
      $(once('webform-select-options-disabled', 'select[data-webform-select-options-disabled]', context)).each(function () {
        var $select = $(this);
        var disabled = $select.attr('data-webform-select-options-disabled').split(/\s*,\s*/);
        $select.find('option').filter(function isDisabled() {
          return ($.inArray(this.value, disabled) !== -1);
        }).attr('disabled', 'disabled');
      });
    }
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for other elements.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Toggle other input (text) field.
   *
   * @param {boolean} show
   *   TRUE will display the text field. FALSE with hide and clear the text field.
   * @param {object} $element
   *   The input (text) field to be toggled.
   * @param {string} effect
   *   Effect.
   */
  function toggleOther(show, $element, effect) {
    var $input = $element.find('input');
    var hideEffect = (effect === false) ? 'hide' : 'slideUp';
    var showEffect = (effect === false) ? 'show' : 'slideDown';

    if (show) {
      // Limit the other inputs width to the parent's container.
      // If the parent container is not visible it's width will be 0
      // and ignored.
      var width = $element.parent().width();
      if (width) {
        $element.width(width);
      }

      // Display the element.
      $element[showEffect]();
      // If not initializing, then focus the other element.
      if (effect !== false) {
        $input.trigger('focus');
      }
      // Require the input.
      $input.prop('required', true).attr('aria-required', 'true');
      // Restore the input's value.
      var value = $input.data('webform-value');
      if (typeof value !== 'undefined') {
        $input.val(value);
        var input = $input.get(0);
        // Move cursor to the beginning of the other text input.
        // @see https://stackoverflow.com/questions/21177489/selectionstart-selectionend-on-input-type-number-no-longer-allowed-in-chrome
        if ($.inArray(input.type, ['text', 'search', 'url', 'tel', 'password']) !== -1) {
          input.setSelectionRange(0, 0);
        }
      }
      // Refresh CodeMirror used as other element.
      $element.parent().find('.CodeMirror').each(function (index, $element) {
        $element.CodeMirror.refresh();
      });
    }
    else {
      // Hide the element.
      $element[hideEffect]();
      // Save the input's value.
      if ($input.val() !== '') {
        $input.data('webform-value', $input.val());
      }
      // Empty and un-required the input.
      $input.val('').prop('required', false).removeAttr('aria-required');
    }
  }

  /**
   * Attach handlers to select other elements.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformSelectOther = {
    attach: function (context) {
      $(once('webform-select-other', '.js-webform-select-other', context)).each(function () {
        var $element = $(this);

        var $select = $element.find('select');
        var $input = $element.find('.js-webform-select-other-input');

        $select.on('change', function () {
          var isOtherSelected = $select
            .find('option[value="_other_"]')
            .is(':selected');
          toggleOther(isOtherSelected, $input);
        });

        var isOtherSelected = $select
          .find('option[value="_other_"]')
          .is(':selected');
        toggleOther(isOtherSelected, $input, false);
      });
    }
  };

  /**
   * Attach handlers to checkboxes other elements.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformCheckboxesOther = {
    attach: function (context) {
      $(once('webform-checkboxes-other', '.js-webform-checkboxes-other', context)).each(function () {
        var $element = $(this);
        var $checkbox = $element.find('input[value="_other_"]');
        var $input = $element.find('.js-webform-checkboxes-other-input');

        $checkbox.on('change', function () {
          toggleOther(this.checked, $input);
        });

        toggleOther($checkbox.is(':checked'), $input, false);
      });
    }
  };

  /**
   * Attach handlers to radios other elements.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformRadiosOther = {
    attach: function (context) {
      $(once('webform-radios-other', '.js-webform-radios-other', context)).each(function () {
        var $element = $(this);

        var $radios = $element.find('input[type="radio"]');
        var $input = $element.find('.js-webform-radios-other-input');

        $radios.on('change', function () {
          toggleOther(($radios.filter(':checked').val() === '_other_'), $input);
        });

        toggleOther(($radios.filter(':checked').val() === '_other_'), $input, false);
      });
    }
  };

  /**
   * Attach handlers to buttons other elements.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformButtonsOther = {
    attach: function (context) {
      $(once('webform-buttons-other', '.js-webform-buttons-other', context)).each(function () {
        var $element = $(this);

        var $buttons = $element.find('input[type="radio"]');
        var $input = $element.find('.js-webform-buttons-other-input');
        var $container = $(this).find('.js-webform-webform-buttons');

        // Create set onchange handler.
        $container.on('change', function () {
          toggleOther(($(this).find(':radio:checked').val() === '_other_'), $input);
        });

        toggleOther(($buttons.filter(':checked').val() === '_other_'), $input, false);
      });
    }
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for checkboxes.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Adds check all or none checkboxes support.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/3068998
   */
  Drupal.behaviors.webformCheckboxesAllorNone = {
    attach: function (context) {
      $(once('webform-checkboxes-all-or-none', '[data-options-all], [data-options-none]', context))
        .each(function () {
          var $element = $(this);

          var options_all_value = $element.data('options-all');
          var options_none_value = $element.data('options-none');

          // Get all checkboxes.
          var $checkboxes = $element.find('input[type="checkbox"]');

          // Get all options/checkboxes.
          var $options = $checkboxes
            .not('[value="' + options_all_value + '"]')
            .not('[value="' + options_none_value + '"]');

          // Get options all and none checkboxes.
          var $options_all = $element
            .find(':checkbox[value="' + options_all_value + '"]');
          var $options_none = $element
            .find(':checkbox[value="' + options_none_value + '"]');

          // All of the above.
          if ($options_all.length) {
            $options_all.on('click', toggleCheckAllEventHandler);
            if ($options_all.prop('checked')) {
              toggleCheckAllEventHandler();
            }
          }

          // None of the above.
          if ($options_none.length) {
            $options_none.on('click', toggleCheckNoneEventHandler);
            toggleCheckNoneEventHandler();
          }

          $options.on('click', toggleCheckboxesEventHandler);
          toggleCheckboxesEventHandler();

          /**
           * Toggle check all checkbox checked state.
           */
          function toggleCheckAllEventHandler() {
            if ($options_all.prop('checked')) {
              // Uncheck options none.
              if ($options_none.is(':checked')) {
                $options_none
                  .prop('checked', false)
                  .trigger('change', ['webform.states']);
              }
              // Check check all unchecked options.
              $options.not(':checked')
                .prop('checked', true)
                .trigger('change', ['webform.states']);
            }
            else {
              // Check uncheck all checked options.
              $options.filter(':checked')
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }

          /**
           * Toggle check none checkbox checked state.
           */
          function toggleCheckNoneEventHandler() {
            if ($options_none.prop('checked')) {
              $checkboxes
                .not('[value="' + options_none_value + '"]')
                .filter(':checked')
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }

          /**
           * Toggle check all checkbox checked state.
           */
          function toggleCheckboxesEventHandler() {
            var isAllChecked = ($options.filter(':checked').length === $options.length);
            if ($options_all.length
              && $options_all.prop('checked') !== isAllChecked) {
              $options_all
                .prop('checked', isAllChecked)
                .trigger('change', ['webform.states']);
            }
            var isOneChecked = $options.is(':checked');
            if ($options_none.length
              && isOneChecked) {
              $options_none
                .prop('checked', false)
                .trigger('change', ['webform.states']);
            }
          }
        });
    }
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for options elements.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach handlers to options buttons element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformOptionsButtons = {
    attach: function (context) {
      // Place <input> inside of <label> before the label.
      $(context).find('label.webform-options-display-buttons-label > input[type="checkbox"], label.webform-options-display-buttons-label > input[type="radio"]').each(function () {
        var $input = $(this);
        var $label = $input.parent();
        $input.detach().insertBefore($label);
      });
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for webform wizard pages.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Link the wizard's previous pages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Links the wizard's previous pages.
   */
  Drupal.behaviors.webformWizardPagesLink = {
    attach: function (context) {
      $(once('webform-wizard-pages-links', '.js-webform-wizard-pages-links', context)).each(function () {
        var $pages = $(this);
        var $form = $pages.closest('form');

        var hasProgressLink = $pages.data('wizard-progress-link');
        var hasPreviewLink = $pages.data('wizard-preview-link');

        $pages.find('.js-webform-wizard-pages-link').each(function () {
          var $button = $(this);
          var title = $button.attr('title');
          var page = $button.data('webform-page');

          // Link progress marker and title.
          if (hasProgressLink) {
            var $progress = $form.find('.webform-progress [data-webform-page="' + page + '"]');
            $progress.find('.progress-marker, .progress-title, .webform-progress-bar__page-title')
              .attr({
                'role': 'link',
                'title': title,
                'aria-label': title,
                'tabindex': '0'
              })
              .on('click', function () {
                $button.trigger('click');
              })
              .on('keydown', function (event) {
                if (event.which === 13) {
                  $button.trigger('click');
                }
              });
            // Only allow the marker to be tabbable.
            $progress.find('.progress-marker, .webform-progress-bar__page-title').attr('tabindex', 0);
          }

          // Move button to preview page div container with [data-webform-page].
          // @see \Drupal\webform\Plugin\WebformElement\WebformWizardPage::formatHtmlItem
          if (hasPreviewLink) {
            $form
              .find('.webform-preview [data-webform-page="' + page + '"]')
              .append($button)
              .show();
          }
        });
      });
    }
  };

})(jQuery, Drupal, once);
;
