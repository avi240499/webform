<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* modules/contrib/captcha/templates/captcha.html.twig */
class __TwigTemplate_b366a40a86d1a42b2e715a6d2b17e110 extends Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
            'captcha' => [$this, 'block_captcha'],
            'captcha_display' => [$this, 'block_captcha_display'],
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $this->checkSecurity();
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 19
        echo "
";
        // line 21
        $context["classes"] = [0 => "captcha", 1 => \Drupal\Component\Utility\Html::getClass(("captcha-type-challenge--" . $this->sandbox->ensureToStringAllowed((($__internal_compile_0 =         // line 23
($context["element"] ?? null)) && is_array($__internal_compile_0) || $__internal_compile_0 instanceof ArrayAccess ? ($__internal_compile_0["#captcha_type_challenge"] ?? null) : null), 23, $this->source)))];
        // line 26
        echo "
";
        // line 27
        $this->displayBlock('captcha', $context, $blocks);
    }

    public function block_captcha($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 28
        echo "  ";
        if (($context["is_visible"] ?? null)) {
            // line 29
            echo "    ";
            $this->displayBlock('captcha_display', $context, $blocks);
            // line 50
            echo "  ";
        } else {
            // line 51
            echo "    ";
            // line 53
            echo "    ";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["element"] ?? null), 53, $this->source), "html", null, true);
            echo "
  ";
        }
    }

    // line 29
    public function block_captcha_display($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 30
        echo "      ";
        if ( !twig_test_empty(($context["title"] ?? null))) {
            // line 31
            echo "        <fieldset ";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, ($context["attributes"] ?? null), "addClass", [0 => ($context["classes"] ?? null)], "method", false, false, true, 31), 31, $this->source), "html", null, true);
            echo ">
          <legend class=\"captcha__title js-form-required form-required\">
            ";
            // line 33
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["title"] ?? null), 33, $this->source), "html", null, true);
            echo "
          </legend>
        ";
        } else {
            // line 36
            echo "          <div ";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, ($context["attributes"] ?? null), "addClass", [0 => ($context["classes"] ?? null)], "method", false, false, true, 36), 36, $this->source), "html", null, true);
            echo ">
        ";
        }
        // line 38
        echo "          <div class=\"captcha__element\">
            ";
        // line 39
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["element"] ?? null), 39, $this->source), "html", null, true);
        echo "
          </div>
          ";
        // line 41
        if ( !twig_test_empty(($context["description"] ?? null))) {
            // line 42
            echo "            <div class=\"captcha__description description\">";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["description"] ?? null), 42, $this->source), "html", null, true);
            echo "</div>
          ";
        }
        // line 44
        echo "      ";
        if ( !twig_test_empty(($context["title"] ?? null))) {
            // line 45
            echo "          </fieldset>
      ";
        } else {
            // line 47
            echo "        </div>
      ";
        }
        // line 49
        echo "    ";
    }

    public function getTemplateName()
    {
        return "modules/contrib/captcha/templates/captcha.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  128 => 49,  124 => 47,  120 => 45,  117 => 44,  111 => 42,  109 => 41,  104 => 39,  101 => 38,  95 => 36,  89 => 33,  83 => 31,  80 => 30,  76 => 29,  68 => 53,  66 => 51,  63 => 50,  60 => 29,  57 => 28,  50 => 27,  47 => 26,  45 => 23,  44 => 21,  41 => 19,);
    }

    public function getSourceContext()
    {
        return new Source("", "modules/contrib/captcha/templates/captcha.html.twig", "/var/www/html/D10/web/modules/contrib/captcha/templates/captcha.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = array("set" => 21, "block" => 27, "if" => 28);
        static $filters = array("clean_class" => 23, "escape" => 53);
        static $functions = array();

        try {
            $this->sandbox->checkSecurity(
                ['set', 'block', 'if'],
                ['clean_class', 'escape'],
                []
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
