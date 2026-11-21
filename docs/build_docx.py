# -*- coding: utf-8 -*-
import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def sanitize_xml(s):
    if not isinstance(s, str):
        return s
    return re.sub(r'[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\U00010000-\U0010FFFF]', '', s)

def set_run_font(run, name='Times New Roman', size=13, bold=False, italic=False, color=(0,0,0)):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color)
    
    rPr = run.element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), name)
    rFonts.set(qn('w:hAnsi'), name)
    rFonts.set(qn('w:cs'), name)
    rFonts.set(qn('w:eastAsia'), name)

def apply_doc_font_defaults(doc):
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(13)
    font.color.rgb = RGBColor(0, 0, 0)
    
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), 'Times New Roman')
    rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    rFonts.set(qn('w:cs'), 'Times New Roman')
    rFonts.set(qn('w:eastAsia'), 'Times New Roman')

def configure_word_compatibility(doc):
    settings = doc.settings.element
    compat_xml = (
        '<w:compat xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:doNotExpandShiftReturn/>'
        '<w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>'
        '</w:compat>'
    )
    compat = parse_xml(compat_xml)
    settings.append(compat)

def set_section_margins(section):
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.0)
    section.header_distance = Cm(1.6)
    section.footer_distance = Cm(1.6)

def add_p(doc, text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, bold=False, italic=False, 
          space_before=0, space_after=4, line_spacing=1.3, first_line_indent=None, left_indent=None):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line_spacing
    if first_line_indent is not None:
        pf.first_line_indent = first_line_indent
    if left_indent is not None:
        pf.left_indent = left_indent
        
    if not text:
        return p
        
    text = sanitize_xml(text)
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*)', text)
    for tok in tokens:
        if not tok:
            continue
        tok = sanitize_xml(tok)
        if tok.startswith('**') and tok.endswith('**') and len(tok) >= 4:
            run = p.add_run(tok[2:-2])
            set_run_font(run, size=size, bold=True, italic=italic)
        elif tok.startswith('*') and tok.endswith('*') and len(tok) >= 2:
            run = p.add_run(tok[1:-1])
            set_run_font(run, size=size, bold=bold, italic=True)
        else:
            run = p.add_run(tok)
            set_run_font(run, size=size, bold=bold, italic=italic)
            
    return p

def add_footer_page_number(section, is_roman=False, start_num=1):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.text = ""
    pf = p.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    
    sectPr = section._sectPr
    pgNumType = sectPr.find(qn('w:pgNumType'))
    if pgNumType is None:
        pgNumType = OxmlElement('w:pgNumType')
        sectPr.append(pgNumType)
        
    if is_roman:
        pgNumType.set(qn('w:fmt'), 'romanLower')
    else:
        pgNumType.set(qn('w:fmt'), 'decimal')
        
    if start_num is not None:
        pgNumType.set(qn('w:start'), str(start_num))
        
    run = p.add_run()
    set_run_font(run, size=11)
    
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="98A2B3"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="98A2B3"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="EAECF0"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_table_from_md(doc, table_rows):
    if not table_rows:
        return
    num_rows = len(table_rows)
    num_cols = len(table_rows[0])
    
    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    
    for r_idx, row in enumerate(table_rows):
        is_header = (r_idx == 0)
        tr = table.rows[r_idx]
        for c_idx, cell_text in enumerate(row):
            if c_idx >= num_cols:
                continue
            cell = tr.cells[c_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            pf = p.paragraph_format
            pf.space_before = Pt(3)
            pf.space_after = Pt(3)
            pf.line_spacing = 1.15
            
            clean_text = sanitize_xml(cell_text.strip().replace('&nbsp;', ' '))
            
            if is_header:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                set_cell_shading(cell, "F2F4F7")
                tokens = re.split(r'(\*\*.*?\*\*)', clean_text)
                for tok in tokens:
                    if tok.startswith('**') and tok.endswith('**'):
                        r = p.add_run(tok[2:-2])
                        set_run_font(r, size=11, bold=True)
                    else:
                        r = p.add_run(tok)
                        set_run_font(r, size=11, bold=True)
            else:
                if (c_idx == 0 and num_cols > 2 and len(clean_text) <= 6) or (c_idx == num_cols - 1 and len(clean_text) <= 6):
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
                tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*)', clean_text)
                for tok in tokens:
                    if tok.startswith('**') and tok.endswith('**'):
                        r = p.add_run(tok[2:-2])
                        set_run_font(r, size=11, bold=True)
                    elif tok.startswith('*') and tok.endswith('*'):
                        r = p.add_run(tok[1:-1])
                        set_run_font(r, size=11, italic=True)
                    else:
                        r = p.add_run(tok)
                        set_run_font(r, size=11)
                        
    # Small spacing after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(4)

def build_thesis_report():
    doc = docx.Document()
    apply_doc_font_defaults(doc)
    configure_word_compatibility(doc)
    
    # =========================================================================
    # SECTION 1: TRANG BÌA (COVER PAGE)
    # =========================================================================
    sec_cover = doc.sections[0]
    set_section_margins(sec_cover)
    sec_cover.footer.is_linked_to_previous = False
    sec_cover.footer.paragraphs[0].text = ""
    
    add_p(doc, "BỘ GIÁO DỤC VÀ ĐÀO TẠO", align=WD_ALIGN_PARAGRAPH.CENTER, size=13, bold=True, space_before=10, space_after=2)
    add_p(doc, "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ / BÁCH KHOA", align=WD_ALIGN_PARAGRAPH.CENTER, size=13, bold=True, space_before=0, space_after=2)
    add_p(doc, "KHOA CÔNG NGHỆ THÔNG TIN", align=WD_ALIGN_PARAGRAPH.CENTER, size=13, bold=True, space_before=0, space_after=6)
    add_p(doc, "━━━━━━━━━━━━━━━━━━━", align=WD_ALIGN_PARAGRAPH.CENTER, size=12, bold=False, space_before=0, space_after=36)
    
    add_p(doc, "ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC", align=WD_ALIGN_PARAGRAPH.CENTER, size=18, bold=True, space_before=0, space_after=6)
    add_p(doc, "CHUYÊN NGÀNH: CÔNG NGHỆ THÔNG TIN / KỸ THUẬT PHẦN MỀM", align=WD_ALIGN_PARAGRAPH.CENTER, size=13, bold=True, space_before=0, space_after=30)
    
    add_p(doc, "ĐỀ TÀI:", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=8)
    add_p(doc, "NGHIÊN CỨU VÀ XÂY DỰNG NỀN TẢNG QUẢN LÝ SÂN BÓNG VÀ TỔ CHỨC GIẢI ĐẤU THỂ THAO TRỰC TUYẾN TURFZONE", 
          align=WD_ALIGN_PARAGRAPH.CENTER, size=16, bold=True, space_before=0, space_after=40)
    
    # Metadata on cover - neatly aligned
    p_meta = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=20, space_after=4, left_indent=Cm(3.0))
    r = p_meta.add_run("Sinh viên thực hiện:\t")
    set_run_font(r, size=13, bold=True)
    r2 = p_meta.add_run("Đại Chưởng Quỹ")
    set_run_font(r2, size=13, bold=False)
    
    p_meta2 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=4, left_indent=Cm(3.0))
    r = p_meta2.add_run("Mã số sinh viên:\t\t")
    set_run_font(r, size=13, bold=True)
    r2 = p_meta2.add_run("2021-CNTT-01")
    set_run_font(r2, size=13, bold=False)
    
    p_meta3 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=4, left_indent=Cm(3.0))
    r = p_meta3.add_run("Lớp sinh hoạt:\t\t")
    set_run_font(r, size=13, bold=True)
    r2 = p_meta3.add_run("Kỹ thuật Phần mềm Khóa 2021")
    set_run_font(r2, size=13, bold=False)
    
    p_meta4 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=2, space_after=40, left_indent=Cm(3.0))
    r = p_meta4.add_run("Giảng viên hướng dẫn:\t")
    set_run_font(r, size=13, bold=True)
    r2 = p_meta4.add_run("TS. Giảng Viên Hướng Dẫn")
    set_run_font(r2, size=13, bold=False)
    
    add_p(doc, "ĐÀ NẴNG - NĂM 2026", align=WD_ALIGN_PARAGRAPH.CENTER, size=13, bold=True, space_before=30, space_after=0)
    
    # =========================================================================
    # SECTION 2: PHẦN ĐẦU (FRONT MATTER) - Roman Numerals (i, ii, iii...)
    # =========================================================================
    sec_front = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    set_section_margins(sec_front)
    add_footer_page_number(sec_front, is_roman=True, start_num=1)
    
    # -------------------------------------------------------------------------
    # TÓM TẮT
    # -------------------------------------------------------------------------
    add_p(doc, "TÓM TẮT", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=0)
    add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, size=13, space_before=0, space_after=0)
    
    # Strictly LEFT ALIGNED metadata to prevent Word space-stretching bug!
    p_t1 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=3, line_spacing=1.3)
    r = p_t1.add_run("Tên đề tài: ")
    set_run_font(r, size=13, bold=True)
    r2 = p_t1.add_run("Nghiên cứu và xây dựng nền tảng quản lý sân bóng và tổ chức giải đấu thể thao trực tuyến Turfzone")
    set_run_font(r2, size=13)
    
    p_t2 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=3, line_spacing=1.3)
    r = p_t2.add_run("Sinh viên thực hiện: ")
    set_run_font(r, size=13, bold=True)
    r2 = p_t2.add_run("Hồ Văn Diện")
    set_run_font(r2, size=13)
    
    p_t3 = add_p(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=10, line_spacing=1.3)
    r = p_t3.add_run("Mã số SV: ")
    set_run_font(r, size=13, bold=True)
    r2 = p_t3.add_run("2251220214          ")
    set_run_font(r2, size=13)
    r3 = p_t3.add_run("Lớp: ")
    set_run_font(r3, size=13, bold=True)
    r4 = p_t3.add_run("22CT5")
    set_run_font(r4, size=13)
    
    add_p(doc, 
          "Trong bối cảnh chuyển đổi số và phong trào thể dục thể thao cộng đồng phát triển mạnh mẽ tại Việt Nam, các cụm sân bóng đá cỏ nhân tạo và đơn vị tổ chức giải đấu phong trào vẫn đang đối mặt với nhiều bất cập từ phương thức quản lý thủ công bằng sổ tay, bảng biểu rời rạc và tin nhắn mạng xã hội. Cách làm truyền thống này dễ dẫn đến tình trạng trùng lịch đặt sân (double-booking), thất thoát tài chính do khách hủy hoặc bỏ cọc, sai sót trong thanh toán dịch vụ Canteen và thiếu tính minh bạch, đồng bộ trong công tác điều hành giải đấu.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, line_spacing=1.3, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Đồ án tốt nghiệp tập trung nghiên cứu, thiết kế và xây dựng hoàn chỉnh nền tảng thể thao số toàn diện Turfzone (SoccerHub Monorepo), kết nối xuyên suốt bốn nhóm đối tượng: Cầu thủ (Player), Chủ cụm sân (Owner), Ban tổ chức giải đấu (Organizer) và Quản trị viên (Admin). Hệ thống được xây dựng theo kiến trúc lai ghép giữa Modular Monolith và Microservices, kết hợp Backend doanh nghiệp Spring Boot 3 (Java 17 LTS) với cơ sở dữ liệu MySQL, giao diện Web Next.js 14 App Router (TypeScript) tuân thủ chuẩn thiết kế Zero-Modal (100% Inline UI) và dịch vụ trí tuệ nhân tạo AI Service phát triển trên nền tảng FastAPI (Python).",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, line_spacing=1.3, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Các kết quả nghiên cứu và triển khai trọng tâm của đồ án bao gồm: (1) Xây dựng cỗ máy trạng thái hữu hạn (FSM) kiểm soát chặt chẽ vòng đời ca sân chống trùng lịch, kết hợp thanh toán cọc tự động theo chuẩn VietQR Napas 24/7 và quầy thu ngân POS Canteen tích hợp bộ đếm giờ thi đấu trực tiếp (Live Timer) cùng tiện ích chia đều tiền sân; (2) Ứng dụng công thức khoảng cách địa lý Haversine, thuật toán phân tích phong độ 5–15 trận gần nhất và hệ thống điểm ELO để gợi ý cụm sân, ghép kèo cân sức, hỗ trợ kèo mời đích danh kèm thông báo điều hướng trực tiếp (deep-link) và phòng chat nóng giữa hai đội; (3) Tự động hóa quy trình tổ chức giải đấu khép kín từ đăng ký đội bóng (liên kết nhanh danh sách từ Câu lạc bộ và bổ sung cầu thủ ngoài), sân khấu bốc thăm chia nhánh theo phong cách UEFA Champions League, tự động xếp lịch thi đấu, thống kê tỷ số – Vua phá lưới cho đến phòng chat nội bộ phân quyền riêng cho từng giải đấu.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, line_spacing=1.3, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Toàn bộ hệ thống đã được kiểm thử nghiêm ngặt qua biên dịch tĩnh TypeScript (tsc --noEmit đạt 0 lỗi), kiểm thử biên dịch Backend Maven (BUILD SUCCESS) và chạy thực nghiệm ổn định với đầy đủ các dịch vụ thời gian thực, khẳng định tính thực tiễn cao và khả năng thương mại hóa mở rộng trong tương lai.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, line_spacing=1.3, first_line_indent=Cm(1.0))
    
    # -------------------------------------------------------------------------
    # LỜI NÓI ĐẦU VÀ CẢM ƠN
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p(doc, "LỜI NÓI ĐẦU", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=14)
    
    add_p(doc, 
          "Bước vào kỷ nguyên chuyển đổi số quốc gia, thể thao phong trào không chỉ đơn thuần là hoạt động nâng cao sức khỏe mà đã phát triển thành một hệ sinh thái kinh tế dịch vụ sôi động, thu hút hàng triệu người tham gia mỗi ngày tại các đô thị lớn trên toàn quốc. Tuy nhiên, khoảng cách công nghệ giữa nhu cầu kết nối tức thì của người chơi với năng lực quản lý thủ công của các chủ cụm sân bóng vẫn còn rất lớn, gây lãng phí tài nguyên xã hội và hạn chế tiềm năng phát triển của thể thao quần chúng.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Xuất phát từ niềm đam mê công nghệ phần mềm và tình yêu cháy bỏng đối với bộ môn bóng đá phong trào, em đã quyết định lựa chọn và thực hiện đề tài tốt nghiệp: **“Nghiên cứu và xây dựng nền tảng quản lý sân bóng và tổ chức giải đấu thể thao trực tuyến Turfzone”**. Đề tài hướng tới việc giải quyết triệt để các bài toán thực tiễn nhức nhối của các chủ sân và người chơi bóng đá phong trào thông qua việc ứng dụng các công nghệ tiên tiến nhất hiện nay như kiến trúc phân tán Spring Boot, Next.js 14, FastAPI, cùng các giải thuật Trí tuệ nhân tạo và chuẩn thanh toán quốc gia VietQR.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Để đồ án tốt nghiệp này được hoàn thành với kết quả tốt đẹp nhất, em xin bày tỏ lòng biết ơn sâu sắc và chân thành nhất tới:",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "• **Quý Thầy, Cô giáo Khoa Công nghệ Thông tin - Trường Đại học Công nghệ / Bách khoa**, những người đã tận tình giảng dạy, truyền đạt nền tảng kiến thức khoa học máy tính vững chắc và rèn luyện đạo đức nghề nghiệp quý báu cho em trong suốt thời gian học tập tại trường.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, left_indent=Cm(0.75))
          
    add_p(doc, 
          "• **Giảng viên hướng dẫn - TS. Giảng Viên Hướng Dẫn**, Thầy đã luôn dành nhiều thời gian quý báu để định hướng nghiên cứu, chỉ bảo tận tâm, khích lệ và đóng góp những ý kiến học thuật sâu sắc giúp em tháo gỡ những vướng mắc kỹ thuật phức tạp trong quá trình xây dựng hệ thống.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, left_indent=Cm(0.75))
          
    add_p(doc, 
          "• **Gia đình, bạn bè và toàn thể các anh em cầu thủ, các chủ cụm sân thể thao phong trào** đã nhiệt tình hỗ trợ cung cấp dữ liệu khảo sát thực tế, tham gia trải nghiệm và đóng góp nhiều phản hồi thực tế vô giá để hoàn thiện sản phẩm.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, left_indent=Cm(0.75))
          
    add_p(doc, 
          "Mặc dù đã rất nỗ lực với tinh thần nghiêm túc và cầu thị, song do giới hạn về thời gian và năng lực nghiên cứu ban đầu, đồ án chắc chắn không tránh khỏi những thiếu sót nhất định. Em rất mong nhận được những ý kiến đóng góp, chỉ bảo quý báu từ Quý Thầy Cô trong Hội đồng chấm đồ án tốt nghiệp để hệ thống ngày càng hoàn thiện và có thể ứng dụng rộng rãi trong thực tiễn. Em xin chân thành cảm ơn!",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, first_line_indent=Cm(1.0))

    # -------------------------------------------------------------------------
    # CAM ĐOAN
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p(doc, "CAM ĐOAN", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=14)
    
    add_p(doc, 
          "Tôi xin cam đoan rằng đồ án tốt nghiệp với đề tài **“Nghiên cứu và xây dựng nền tảng quản lý sân bóng và tổ chức giải đấu thể thao trực tuyến Turfzone”** là công trình nghiên cứu và phát triển phần mềm độc lập, được thực hiện bởi chính bản thân tôi dưới sự hướng dẫn khoa học trực tiếp của Giảng viên hướng dẫn.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "Tôi xin cam kết tuân thủ nghiêm ngặt chuẩn mực liêm chính học thuật:",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, first_line_indent=Cm(1.0))
          
    add_p(doc, 
          "1. Toàn bộ số liệu khảo sát thị trường, mô hình kiến trúc phần mềm, mã nguồn chương trình (Spring Boot, Next.js, FastAPI, MySQL) và các kịch bản kiểm thử thực nghiệm được trình bày trong báo cáo này hoàn toàn trung thực, phản ánh chính xác kết quả xây dựng mã nguồn thực tế của dự án.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, left_indent=Cm(0.75))
          
    add_p(doc, 
          "2. Mọi thông tin, tài liệu tham khảo, thuật toán và thư viện mã nguồn mở được kế thừa từ các công trình nghiên cứu của các tác giả khác đều đã được trích dẫn nguồn gốc và xuất xứ rõ ràng theo đúng quy chuẩn học thuật của Nhà trường và quốc tế.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, left_indent=Cm(0.75))
          
    add_p(doc, 
          "3. Đề tài này chưa từng được sao chép hoặc nộp để nhận bất kỳ học vị hay giải thưởng nào tại các trường đại học, viện nghiên cứu khác.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=5, left_indent=Cm(0.75))
          
    add_p(doc, 
          "Nếu có bất kỳ sự gian lận hay vi phạm liêm chính học thuật nào được phát hiện, tôi xin chịu hoàn toàn mọi hình thức kỷ luật trước Hội đồng chấm đồ án tốt nghiệp và Nhà trường.",
          align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=24, first_line_indent=Cm(1.0))
          
    # Signature block - right aligned
    add_p(doc, "Đà Nẵng, ngày 17 tháng 11 năm 2026", align=WD_ALIGN_PARAGRAPH.RIGHT, size=13, italic=True, space_before=0, space_after=2)
    add_p(doc, "Sinh viên thực hiện", align=WD_ALIGN_PARAGRAPH.RIGHT, size=13, bold=True, space_before=0, space_after=2)
    add_p(doc, "(Ký và ghi rõ họ tên)", align=WD_ALIGN_PARAGRAPH.RIGHT, size=12, italic=True, space_before=0, space_after=40)
    add_p(doc, "Đại Chưởng Quỹ", align=WD_ALIGN_PARAGRAPH.RIGHT, size=13, bold=True, space_before=0, space_after=0)

    # -------------------------------------------------------------------------
    # MỤC LỤC
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p(doc, "MỤC LỤC", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=14)
    
    toc_data = [
        ["Tên đề mục", "Trang"],
        ["Tóm tắt", ""],
        ["Lời nói đầu và cảm ơn", "i"],
        ["Cam đoan", "ii"],
        ["Mục lục", "iii"],
        ["Danh sách các bảng biểu, hình vẽ và sơ đồ", "v"],
        ["Danh sách các cụm từ viết tắt", "vi"],
        ["MỞ ĐẦU", "1"],
        ["Chương 1: TỔNG QUAN CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ", "5"],
        ["    1.1. Cơ sở lý thuyết về hệ thống quản lý thể thao và đặt sân thông minh", "5"],
        ["        1.1.1. Máy trạng thái hữu hạn (FSM) vòng đời ca đặt sân", "5"],
        ["        1.1.2. Cơ chế khóa lạc quan và kiểm soát xung đột đồng thời", "6"],
        ["    1.2. Tổng quan về hệ thống gợi ý và thuật toán kết nối AI", "7"],
        ["        1.2.1. Thuật toán gợi ý cụm sân tối ưu Haversine", "7"],
        ["        1.2.2. Thuật toán ghép kèo thi đấu cân bằng phong độ", "10"],
        ["    1.3. Khảo sát công nghệ phát triển hệ thống", "14"],
        ["        1.3.1. Công nghệ Frontend Next.js & Thiết kế Zero-Modal", "14"],
        ["        1.3.2. Công nghệ Backend Spring Boot, FastAPI và CSDL MySQL", "18"],
        ["Chương 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", "25"],
        ["    2.1. Khảo sát yêu cầu và xác định tác nhân hệ thống", "25"],
        ["        2.1.1. Khảo sát hiện trạng và bài toán nghiệp vụ", "25"],
        ["        2.1.2. Xác định các tác nhân hệ thống (Actors)", "28"],
        ["    2.2. Phân tích yêu cầu chức năng và phi chức năng", "30"],
        ["    2.3. Thiết kế mô hình Use Case và đặc tả chi tiết", "34"],
        ["        2.3.1. Ma trận phân quyền Ca sử dụng (Use Case Matrix)", "34"],
        ["        2.3.2. Đặc tả Ca sử dụng UC-01: Đặt sân trực tuyến & VietQR", "37"],
        ["        2.3.3. Đặc tả Ca sử dụng UC-02: Check-in, Live Timer và Hóa đơn POS", "40"],
        ["    2.4. Thiết kế biểu đồ hoạt động và tuần tự (Sequence Diagrams)", "43"],
        ["        2.4.1. Quy trình Đặt sân và Thanh toán cọc VietQR 24/7", "43"],
        ["        2.4.2. Quy trình Điều hành sân, Live Match Timer và POS Quầy", "46"],
        ["    2.5. Thiết kế Cơ sở Dữ liệu quan hệ chuẩn 3NF", "49"],
        ["        2.5.1. Mô hình thực thể liên kết (ERD Matrix)", "49"],
        ["        2.5.2. Từ điển dữ liệu các bảng nòng cốt", "52"],
        ["Chương 3: TRIỂN KHAI HỆ THỐNG VÀ KẾT QUẢ ĐẠT ĐƯỢC", "58"],
        ["    3.1. Cấu hình hệ thống và quy trình cài đặt vận hành", "58"],
        ["        3.1.1. Danh mục biến môi trường và hạ tầng đám mây", "58"],
        ["        3.1.2. Quy trình khởi chạy tự động Native Local với run.bat", "60"],
        ["    3.2. Kết quả đạt được các phân hệ chức năng thực tế", "62"],
        ["        3.2.1. Phân hệ Ma trận ca sân & Đặt cọc tự động VietQR", "62"],
        ["        3.2.2. Phân hệ Điều hành sân bóng 4 trạng thái & POS Canteen", "64"],
        ["        3.2.3. Phân hệ Quản lý giải đấu & Lễ bốc thăm số hóa UEFA", "67"],
        ["        3.2.4. Tối ưu hóa trải nghiệm di động Responsive Zero-Modal", "70"],
        ["    3.3. Đánh giá kiểm thử và an toàn hệ thống", "72"],
        ["KẾT LUẬN VÀ KIẾN NGHỊ", "74"],
        ["TÀI LIỆU THAM KHẢO", "77"],
        ["PHỤ LỤC", "79"],
        ["    Phụ lục 1: Hướng dẫn cài đặt và khởi chạy hệ thống Native Local", "79"],
        ["    Phụ lục 2: Mẫu hóa đơn POS quầy và ảnh chuyển khoản VietQR 24/7", "81"]
    ]
    add_table_from_md(doc, toc_data)

    # -------------------------------------------------------------------------
    # DANH SÁCH BẢNG VÀ HÌNH VẼ
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p(doc, "DANH SÁCH CÁC BẢNG, HÌNH VẼ", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=12)
    
    add_p(doc, "DANH SÁCH BẢNG BIỂU:", align=WD_ALIGN_PARAGRAPH.LEFT, size=13, bold=True, space_before=6, space_after=4)
    tbl_items = [
        ["Ký hiệu bảng", "Tên bảng biểu", "Trang"],
        ["BẢNG 1.1", "Bảng tổng hợp công nghệ và cổng dịch vụ trong hệ thống Turfzone", "18"],
        ["BẢNG 1.2", "Bảng chuyển đổi trạng thái vòng đời ca đặt sân (FSM Transitions)", "6"],
        ["BẢNG 2.1", "Khảo sát hiện trạng và nhu cầu chuyển đổi số thể thao phong trào", "26"],
        ["BẢNG 2.2", "Ma trận phân quyền Ca sử dụng (Use Case Matrix) theo từng tác nhân", "35"],
        ["BẢNG 2.3", "Đặc tả Ca sử dụng UC-01: Đặt sân trực tuyến & Xuất mã VietQR 24/7", "38"],
        ["BẢNG 2.4", "Đặc tả Ca sử dụng UC-02: Check-in, Đếm giờ Live và Hóa đơn POS quầy", "41"],
        ["BẢNG 2.5", "Bảng mô tả luồng tuần tự Đặt sân và Thanh toán cọc VietQR 24/7", "44"],
        ["BẢNG 2.6", "Bảng mô tả luồng tuần tự Check-in, Live Timer và Hóa đơn POS tại quầy", "47"],
        ["BẢNG 2.7", "Bảng ma trận quan hệ liên kết thực thể dữ liệu (ERD Matrix)", "50"],
        ["BẢNG 2.8", "Bảng từ điển dữ liệu thực thể đơn đặt ca sân (pitch_bookings)", "53"],
        ["BẢNG 2.9", "Bảng từ điển dữ liệu thực thể người dùng và phân quyền (users)", "55"],
        ["BẢNG 2.10", "Bảng từ điển dữ liệu thực thể cụm sân thể thao (pitches)", "56"],
        ["BẢNG 3.1", "Danh mục các biến môi trường cấu hình hệ thống", "59"]
    ]
    add_table_from_md(doc, tbl_items)
    
    add_p(doc, "DANH SÁCH HÌNH VẼ VÀ SƠ ĐỒ:", align=WD_ALIGN_PARAGRAPH.LEFT, size=13, bold=True, space_before=10, space_after=4)
    fig_items = [
        ["Ký hiệu hình", "Tên hình vẽ / sơ đồ", "Trang"],
        ["HÌNH 1.1", "Sơ đồ luồng trạng thái máy hữu hạn vòng đời ca đặt sân (FSM)", "7"],
        ["HÌNH 2.1", "Sơ đồ phân rã chức năng toàn hệ thống Turfzone", "32"],
        ["HÌNH 2.2", "Sơ đồ tuần tự tương tác Đặt sân và Thanh toán VietQR", "45"],
        ["HÌNH 2.3", "Sơ đồ tuần tự tương tác Check-in, Live Timer và POS Canteen", "48"],
        ["HÌNH 2.4", "Sơ đồ thực thể liên kết (ERD) quan hệ chuẩn 3NF", "51"],
        ["HÌNH 3.1", "Sơ đồ kiến trúc phân tầng hệ thống (Frontend - Backend - AI Engine)", "61"],
        ["HÌNH 3.2", "Giao diện Ma trận ca sân thời gian thực và mã VietQR Napas", "63"],
        ["HÌNH 3.3", "Giao diện Điều hành sân bóng 4 trạng thái và Hóa đơn POS quầy", "66"],
        ["HÌNH 3.4", "Giao diện Sân khấu bốc thăm số hóa minh bạch (UEFA Champions League style)", "69"]
    ]
    add_table_from_md(doc, fig_items)

    # -------------------------------------------------------------------------
    # DANH SÁCH KÝ HIỆU & TỪ VIẾT TẮT
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p(doc, "DANH SÁCH CÁC KÝ HIỆU, CHỮ VIẾT TẮT", align=WD_ALIGN_PARAGRAPH.CENTER, size=14, bold=True, space_before=0, space_after=12)
    
    add_p(doc, "KÝ HIỆU:", align=WD_ALIGN_PARAGRAPH.LEFT, size=13, bold=True, space_before=6, space_after=4)
    sym_items = [
        ["Ký hiệu", "Ý nghĩa giải thích"],
        ["w1, w2, w3, w4", "Các hệ số trọng số chuẩn hóa của thuật toán gợi ý cụm sân đa tiêu chí"],
        ["d", "Khoảng cách địa lý đại vòng tròn giữa tọa độ GPS người dùng và cơ sở sân bóng (km)"],
        ["S_dist", "Điểm đánh giá thành phần khoảng cách địa lý theo hàm suy giảm tuyến tính"],
        ["S_rate", "Điểm đánh giá chất lượng mặt sân từ phản hồi của khách hàng"],
        ["S_price", "Điểm đánh giá mức độ tương thích về giá ca so với ngân sách dự kiến"],
        ["S_amen", "Điểm tiện ích phụ trợ của cơ sở thể thao (đèn cao áp, căng tin, bãi đỗ xe)"],
        ["F", "Điểm số phong độ chuỗi 5 trận thi đấu gần nhất của đội bóng"],
        ["Similarity(A, B)", "Hệ số tương đồng phong độ giữa 2 đội bóng phục vụ thuật toán ghép kèo"]
    ]
    add_table_from_md(doc, sym_items)
    
    add_p(doc, "CHỮ VIẾT TẮT:", align=WD_ALIGN_PARAGRAPH.LEFT, size=13, bold=True, space_before=10, space_after=4)
    abbr_items = [
        ["Từ viết tắt", "Tên tiếng Anh đầy đủ", "Ý nghĩa trong hệ thống"],
        ["API", "Application Programming Interface", "Giao diện lập trình ứng dụng kết nối Frontend và Backend"],
        ["JWT", "JSON Web Token", "Chuẩn mã hóa token xác thực người dùng phân tán"],
        ["FSM", "Finite State Machine", "Máy trạng thái hữu hạn kiểm soát vòng đời của một ca đặt sân"],
        ["ACID", "Atomicity, Consistency, Isolation, Durability", "Bốn thuộc tính đảm bảo tính tin cậy của giao dịch CSDL"],
        ["POS", "Point of Sale", "Hệ thống điểm bán hàng xuất hóa đơn trực tiếp tại quầy"],
        ["ORM", "Object-Relational Mapping", "Kỹ thuật ánh xạ bảng CSDL quan hệ sang lớp đối tượng"],
        ["REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ web truyền tải dữ liệu JSON"],
        ["RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập phân quyền dựa trên vai trò"],
        ["VietQR", "Vietnam National QR Code Standard", "Chuẩn mã QR chuyển tiền Napas 24/7 liên ngân hàng"],
        ["UEFA", "Union of European Football Associations", "Quy chuẩn bốc thăm phân nhánh cúp châu Âu"],
        ["SSR / CSR", "Server-Side / Client-Side Rendering", "Cơ chế kết xuất giao diện máy chủ / trình duyệt của Next.js"],
        ["ERD", "Entity Relationship Diagram", "Sơ đồ thực thể liên kết trong thiết kế cơ sở dữ liệu"]
    ]
    add_table_from_md(doc, abbr_items)

    # =========================================================================
    # SECTION 3: NỘI DUNG CHÍNH (BODY) - Arabic Numerals (1, 2, 3...) from MỞ ĐẦU
    # =========================================================================
    sec_body = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    set_section_margins(sec_body)
    add_footer_page_number(sec_body, is_roman=False, start_num=1)
    
    with open('docs/BAO_CAO_DO_AN_TOT_NGHIEP.md', 'r', encoding='utf-8') as f:
        md_text = f.read()
        
    mo_dau_pos = md_text.find('# MỞ ĐẦU')
    body_md = md_text[mo_dau_pos:]
    
    lines = body_md.split('\n')
    i = 0
    current_table = []
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if table line
        if stripped.startswith('|') and stripped.endswith('|'):
            cols = [c.strip() for c in stripped[1:-1].split('|')]
            is_sep = all(re.match(r'^:?-+:?$', c) for c in cols if c)
            if not is_sep:
                current_table.append(cols)
            i += 1
            continue
        else:
            if current_table:
                add_table_from_md(doc, current_table)
                current_table = []
                
        if not stripped:
            i += 1
            continue
            
        if stripped.startswith('---') or '<div' in stripped or '</div' in stripped or stripped.startswith('<br'):
            i += 1
            continue
            
        if stripped.startswith('*(') and stripped.endswith(')*'):
            i += 1
            continue
            
        if stripped.startswith('# '):
            h_text = stripped[2:].strip()
            if h_text.startswith('Chương') or h_text.startswith('KẾT LUẬN') or h_text.startswith('TÀI LIỆU') or h_text.startswith('PHỤ LỤC'):
                doc.add_page_break()
                add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.CENTER, size=15, bold=True, space_before=12, space_after=10)
            elif h_text == 'MỞ ĐẦU':
                add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.CENTER, size=16, bold=True, space_before=0, space_after=14)
            else:
                add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.CENTER, size=15, bold=True, space_before=12, space_after=10)
            i += 1
            continue
            
        if stripped.startswith('## '):
            h_text = stripped[3:].strip()
            add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.LEFT, size=14, bold=True, space_before=10, space_after=4)
            i += 1
            continue
            
        if stripped.startswith('### '):
            h_text = stripped[4:].strip()
            add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.LEFT, size=13, bold=True, space_before=8, space_after=3)
            i += 1
            continue
            
        if stripped.startswith('#### '):
            h_text = stripped[5:].strip()
            add_p(doc, h_text, align=WD_ALIGN_PARAGRAPH.CENTER, size=12, bold=True, italic=True, space_before=8, space_after=4)
            i += 1
            continue
            
        if stripped.startswith('```'):
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines):
                i += 1
            code_text = sanitize_xml('\n'.join(code_lines))
            
            cb_table = doc.add_table(rows=1, cols=1)
            cb_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = cb_table.rows[0].cells[0]
            set_cell_shading(cell, "F8F9FA")
            set_table_borders(cb_table)
            cp = cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(4)
            cp.paragraph_format.space_after = Pt(4)
            cp.paragraph_format.line_spacing = 1.05
            crun = cp.add_run(code_text)
            set_run_font(crun, name='Consolas', size=9.5)
            
            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_before = Pt(2)
            p_sp.paragraph_format.space_after = Pt(4)
            continue
            
        if stripped.startswith('- ') or stripped.startswith('* '):
            item_text = stripped[2:].strip()
            add_p(doc, "• " + item_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=3, left_indent=Cm(0.75))
            i += 1
            continue
            
        num_match = re.match(r'^(\d+\.)\s+(.*)$', stripped)
        if num_match:
            num_prefix = num_match.group(1)
            rest_text = num_match.group(2)
            add_p(doc, num_prefix + " " + rest_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=2, space_after=4, first_line_indent=Cm(0.5))
            i += 1
            continue
            
        add_p(doc, stripped, align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=13, space_before=0, space_after=4, first_line_indent=Cm(1.0))
        i += 1
        
    if current_table:
        add_table_from_md(doc, current_table)

    target_files = [
        'docs/BAO_CAO_DO_AN_TOT_NGHIEP_CHUAN_MAU.docx',
        'docs/BAO_CAO_DO_AN_TOT_NGHIEP_HOAN_THIEN.docx',
        'docs/BAO_CAO_DO_AN_TOT_NGHIEP.docx'
    ]
    
    for fpath in target_files:
        try:
            doc.save(fpath)
            print(f"SUCCESS: Saved {fpath}")
        except Exception as e:
            print(f"ERROR saving {fpath}: {e}")

if __name__ == '__main__':
    build_thesis_report()
