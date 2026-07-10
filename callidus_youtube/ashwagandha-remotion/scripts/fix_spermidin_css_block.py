from pathlib import Path
path = Path(r'C:\Users\marga\callidus_youtube\ashwagandha-remotion\src\styles.css')
css = path.read_text(encoding='utf-8')
start = css.index('.sdeep-molecule span {')
end = css.index('.sdeep-autophagy {', start)
replacement = '''.sdeep-molecule span {
  position: absolute;
  width: 136px;
  height: 136px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid rgba(124, 207, 158, 0.76);
  background: rgba(124, 207, 158, 0.23);
  color: #fffaf0;
  font-size: 17px;
  font-weight: 950;
  text-align: center;
  z-index: 2;
}

.sdeep-molecule span:nth-of-type(3) {
  border-color: rgba(216, 194, 115, 0.72);
  background: rgba(216, 194, 115, 0.22);
}

.sdeep-molecule span:nth-of-type(4) {
  border-color: rgba(116, 166, 190, 0.72);
  background: rgba(116, 166, 190, 0.2);
}

.sdeep-molecule strong,
.sdeep-food-wheel strong,
.sdeep-summary-ring strong {
  color: #fffaf0;
  font-size: 42px;
  line-height: 1;
  text-align: center;
  text-shadow: 0 14px 40px rgba(0, 0, 0, 0.36);
}

.sdeep-molecule strong {
  position: absolute;
  left: 70px;
  right: 70px;
  bottom: 74px;
  font-size: 34px;
  line-height: 1.04;
  z-index: 3;
}

'''
path.write_text(css[:start] + replacement + css[end:], encoding='utf-8')
print('fixed molecule css block')
