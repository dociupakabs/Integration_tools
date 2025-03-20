# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh



/////Notes/////

Zrobione                Dorobić aby do kodu dodawało nazwę pliku z jakiego został wygenerowany + timestamp 

Dodać tworzenie walidacji
Dodać progres aplikacji z lewej strony (na której stronie jesteś i jaki step)
Next step po wygenerowniu xslt to sprawdznie kodu na pliku, jak działa kod przygotowany przez generator

Przerobić aby po podaniu dokumentacji robiło też ASO, KLT, RPS, SMG .....
RPS są chyba w RETAIL to w sumie kolejne fajne mapowanie

Nowa nazwa dla takiego molocha

ID_KLS
REGION
NAZWA
SKROT
ID_KRAJ
NIP
KOD
MIASTO
ULICA
NR_LOK
DATA_OD
DATA_DO
POWIERZCHNIA
LICZBA_KAS
TELEFON
EMAIL
KATEGORIA
TYP_SKLEPU
KLASYFIKACJA
REGAL_CHLODNICZY
LADA_MIESNA


Co robimy z NIP przypadki:

<xsl:attribute name="NIP">
	<xsl:choose>
		<xsl:when test="string-length(cell[@id = '8']) = 0">
			<xsl:value-of select="'0000000000'" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="replace(cell[@id = '8'],'-','')" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>

<xsl:attribute name="NIP">
	<xsl:choose>
		<xsl:when test="contains(cell[@id = '6'],'-')">
			<xsl:value-of select="replace(cell[@id = '6'], '-','')" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="format-number(cell[@id = '6'], '0')" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>

<xsl:attribute name="NIP">
	<xsl:choose>
		<xsl:when test="cell[@id = 11] castable as xs:double">
			<xsl:value-of select="format-number(cell[@id = 11], '0')" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="normalize-space(cell[@id = 11])" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>

<xsl:attribute name="NIP" select="format-number(xs:double(normalize-space(replace(cell[@id = 7], '-', ''))), '0')" />

<xsl:attribute name="NIP">
	<xsl:choose>
		<xsl:when test="contains(cell[@id = 7],'E')">
			<xsl:value-of select="format-number(cell[@id = 7], '0')" />
		</xsl:when>
	<xsl:otherwise>
		<xsl:variable name="nipClean" select="normalize-space(replace(cell[@id = 7], '[^\d]', ''))"/>
		<xsl:choose>
			<xsl:when test="string(number($nipClean)) != 'NaN'">
				<xsl:value-of select="format-number(number($nipClean), '0')" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$nipClean" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>

<xsl:attribute name="NIP">
	<xsl:choose>
		<xsl:when test="cell[@id = 6] castable as xs:decimal">
			<xsl:value-of select="format-number(cell[@id = 6], '0')"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="cell[@id = 6]"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>

<xsl:attribute name="NIP">
	<xsl:choose>
		<!-- Usuwanie spacji lub myślników i konwersja na liczbę -->
		<xsl:when test="not(contains(cell[@id = 6], ' ') or contains(cell[@id = 6], '-')) and number(cell[@id = 6]) = number(cell[@id = 6])">
			<xsl:value-of select="format-number(number(cell[@id = 6]), '0')"/>
		</xsl:when>
		<!-- Usuwanie myślników i spacji z numeru -->
		<xsl:otherwise>
			<xsl:value-of select="normalize-space(replace(replace(cell[@id = 6], '-', ''), ' ', ''))"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:attribute>



dalej wybiera zły row w mc
usunąć '' z for-each
niech w for-each sprawdza id_kls jeśli wybrane lub nazwa 
na polach jak kategoria i POWIERZCHNIA dodać if not null
czy jak generuje mc to daje cell id number dla powierzchni w ciapkach czy bez, czy ma to znaczenie?