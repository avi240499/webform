/**
 * @file
 * JavaScript behaviors for jQuery Text Counter integration.
 */

(function ($, Drupal, once) {

  'use strict';

  // @see https://github.com/ractoon/jQuery-Text-Counter#options
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.counter = Drupal.webform.counter || {};
  Drupal.webform.counter.options = Drupal.webform.counter.options || {};

  /**
   * Initialize text field and textarea word and character counter.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformCounter = {
    attach: function (context) {
      if (!$.fn.textcounter) {
        return;
      }

      $(once('webform-counter', '.js-webform-counter', context)).each(function () {
        var options = {
          type: $(this).data('counter-type'),
          max: $(this).data('counter-maximum'),
          min: $(this).data('counter-minimum') || 0,
          counterText: $(this).data('counter-minimum-message'),
          countDownText: $(this).data('counter-maximum-message'),
          inputErrorClass: 'webform-counter-warning',
          counterErrorClass: 'webform-counter-warning',
          countSpaces: true,
          twoCharCarriageReturn: true,
          stopInputAtMaximum: false,
          // Don't display min/max message since server-side validation will
          // display these messages.
          minimumErrorText: '',
          maximumErrorText: ''
        };

        options.countDown = (options.max) ? true : false;
        if (!options.counterText) {
          options.counterText = (options.type === 'word') ? Drupal.t('%d word(s) entered') : Drupal.t('%d character(s) entered');
        }
        if (!options.countDownText) {
          options.countDownText = (options.type === 'word') ? Drupal.t('%d word(s) remaining') : Drupal.t('%d character(s) remaining');
        }

        options = $.extend(options, Drupal.webform.counter.options);

        $(this).textcounter(options);
      });

    }
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * Copied from jquery-validation additional-methods.
 *
 * Adapted to Drupal js coding standards. This allows using a regex pattern
 * for the validation without having to load the 40+ KB of js in
 * additional-methods.js.
 */
(function ($) {
  $.validator.addMethod('pattern', function (value, element, param) {
    if (this.optional(element)) {
      return true;
    }
    if (typeof param === 'string') {
      param = new RegExp('^(?:' + param + ')$');
    }
    return param.test(value);
  }, 'Invalid format.');
})(jQuery);
;
/**
 * @file
 * JavaScript behaviors for element (read) more.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Element (read) more.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformElementMore = {
    attach: function (context) {
      $(once('webform-element-more', '.js-webform-element-more', context)).each(function (event) {
        var $more = $(this);
        var $a = $more.find('a').first();
        var $content = $more.find('.webform-element-more--content');

        // Add aria-* attributes.
        $a.attr({
          'aria-expanded': false,
          'aria-controls': $content.attr('id')
        });

        // Add event handlers.
        $a.parent().on('click', toggle)
          .on('keydown', function (event) {
            // Space or Return.
            if (event.which === 32 || event.which === 13) {
              toggle(event);
            }
          });

        function toggle(event) {
          var expanded = ($a.attr('aria-expanded') === 'true');

          // Toggle `aria-expanded` attributes on link.
          $a.attr('aria-expanded', !expanded);

          // Toggle content and more .is-open state.
          if (expanded) {
            $more.removeClass('is-open');
            $content.slideUp();
          }
          else {
            $more.addClass('is-open');
            $content.slideDown();
          }

          event.preventDefault();
        }
      });
    }
  };

})(jQuery, Drupal, once);
;
