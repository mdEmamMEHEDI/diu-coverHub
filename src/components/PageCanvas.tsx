import { memo } from 'react';
import { PAGE_H, PAGE_W, resolve, type FieldDef, type TemplateDef, type Values } from '../lib/templates';
import { fitSingle, fontAsc, fontDesc, layoutMulti } from '../lib/text';

interface Props {
  template: TemplateDef;
  values: Values;
  scale: number;
  hints: boolean;
  activeKey: string | null;
  invalidKeys: Set<string>;
  onChange: (def: FieldDef, value: string) => void;
  onActive: (key: string | null) => void;
  onEnter: (key: string) => void;
}

interface BoxProps {
  def: FieldDef;
  template: TemplateDef;
  values: Values;
  active: boolean;
  invalid: boolean;
  onChange: (def: FieldDef, value: string) => void;
  onActive: (key: string | null) => void;
  onEnter: (key: string) => void;
}

function FieldBox({ def, template, values, active, invalid, onChange, onActive, onEnter }: BoxProps) {
  const value = resolve(template, values, def);
  const asc = fontAsc(def.font);
  const desc = fontDesc(def.font);
  const empty = value.trim() === '';
  const cls = `pf ${def.font}${empty ? ' empty' : ''}${active ? ' active' : ''}${invalid ? ' invalid' : ''}`;

  if (def.multi) {
    const lay = layoutMulti(def.font, value, def.size, def.multi);
    const halfLeading = (lay.lineHeight - (asc + desc) * lay.size) / 2;
    return (
      <textarea
        data-page-field={def.key}
        className={`${cls} multi`}
        value={value}
        placeholder={def.placeholder}
        spellCheck={false}
        style={{
          left: def.multi.x,
          top: def.baseline - asc * lay.size - halfLeading,
          width: def.multi.width,
          height: def.multi.maxHeight + 3,
          fontSize: lay.size,
          lineHeight: `${lay.lineHeight}px`,
          textIndent: def.multi.firstIndent,
        }}
        onChange={(e) => onChange(def, e.target.value)}
        onFocus={() => onActive(def.key)}
        onBlur={() => onActive(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(def.key);
          }
        }}
      />
    );
  }

  const fit = fitSingle(def.font, value, def.size, def.width);
  const h = (asc + desc) * fit.size;
  return (
    <input
      data-page-field={def.key}
      className={cls}
      type="text"
      value={value}
      placeholder={def.placeholder}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      style={{
        left: def.x,
        top: def.baseline - asc * fit.size,
        width: def.width,
        height: h,
        fontSize: fit.size,
        lineHeight: `${h}px`,
        textAlign: def.align === 'center' ? 'center' : 'left',
      }}
      onChange={(e) => onChange(def, e.target.value)}
      onFocus={() => onActive(def.key)}
      onBlur={() => onActive(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter(def.key);
        }
      }}
    />
  );
}

function PageCanvasBase({ template, values, scale, hints, activeKey, invalidKeys, onChange, onActive, onEnter }: Props) {
  return (
    <div className={`page-shell ${hints ? 'hints' : ''}`} style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
      <div className="page" style={{ transform: `scale(${scale})` }}>
        <img className="base" src={template.image} alt={`${template.name} cover page template`} width={PAGE_W} height={PAGE_H} draggable={false} />
        {template.fields.map((def) => (
          <FieldBox
            key={def.key}
            def={def}
            template={template}
            values={values}
            active={activeKey === def.key}
            invalid={invalidKeys.has(def.key)}
            onChange={onChange}
            onActive={onActive}
            onEnter={onEnter}
          />
        ))}
      </div>
    </div>
  );
}

export const PageCanvas = memo(PageCanvasBase);
