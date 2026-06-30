export interface HubFile {
  label: string
  category: string
  filename: string
  url: string
  required?: boolean
}

export interface HubModel {
  id: string
  name: string
  description: string
  presetId: string
  docsUrl: string
  files: HubFile[]
  gated?: boolean
}

export const hubModels: HubModel[] = [
  {
    id: 'sdxl',
    name: 'SDXL',
    description: 'Classic checkpoint workflow. Downloads the SDXL base checkpoint plus recommended VAE.',
    presetId: 'builtin-sdxl',
    docsUrl: 'https://github.com/leejet/stable-diffusion.cpp/blob/master/docs/sd.md',
    files: [
      {
        label: 'SDXL Base 1.0 checkpoint',
        category: 'diffusion',
        filename: 'sd_xl_base_1.0.safetensors',
        required: true,
        url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors'
      },
      {
        label: 'SDXL VAE fp16 fix',
        category: 'vae',
        filename: 'sdxl_vae-fp16-fix.safetensors',
        required: false,
        url: 'https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors'
      }
    ]
  },
  {
    id: 'sd35',
    name: 'SD3 / SD3.5',
    description: 'Split text encoders with CLIP-L, CLIP-G, T5XXL, and SD3.5 diffusion model.',
    presetId: 'builtin-sd35',
    docsUrl: 'https://github.com/leejet/stable-diffusion.cpp/blob/master/docs/sd3.md',
    files: [
      {
        label: 'SD3.5 Large diffusion',
        category: 'diffusion',
        filename: 'sd3.5_large.safetensors',
        required: true,
        url: 'https://huggingface.co/stabilityai/stable-diffusion-3.5-large/resolve/main/sd3.5_large.safetensors'
      },
      {
        label: 'CLIP-L',
        category: 'clip',
        filename: 'clip_l.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/resolve/main/text_encoders/clip_l.safetensors'
      },
      {
        label: 'CLIP-G',
        category: 'clipG',
        filename: 'clip_g.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/resolve/main/text_encoders/clip_g.safetensors'
      },
      {
        label: 'T5XXL fp16',
        category: 't5xxl',
        filename: 't5xxl_fp16.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/stable-diffusion-3.5-fp8/resolve/main/text_encoders/t5xxl_fp16.safetensors'
      }
    ]
  },
  {
    id: 'krea2',
    name: 'Krea 2',
    description: 'Krea 2 Turbo — 12B DiT, distilled for 8 steps, CFG-free. Fast high-quality text-to-image.',
    presetId: 'builtin-krea2',
    docsUrl: 'https://huggingface.co/Comfy-Org/Krea-2',
    files: [
      {
        label: 'Krea 2 Turbo fp8 scaled',
        category: 'diffusion',
        filename: 'krea2_turbo_fp8_scaled.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/Krea-2/resolve/main/diffusion_models/krea2_turbo_fp8_scaled.safetensors'
      },
      {
        label: 'Qwen3-VL 4B fp8 scaled',
        category: 'llm',
        filename: 'qwen3vl_4b_fp8_scaled.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/Krea-2/resolve/main/text_encoders/qwen3vl_4b_fp8_scaled.safetensors'
      },
      {
        label: 'Krea 2 VAE',
        category: 'vae',
        filename: 'qwen_image_vae.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/Krea-2/resolve/main/vae/qwen_image_vae.safetensors'
      }
    ]
  },
  {
    id: 'flux2-klein-9b',
    name: 'FLUX.2 Klein 9B',
    description: 'FLUX.2 Klein — 9B rectified flow, step-distilled to 4 steps. Ultra-fast image generation. Gated model.',
    presetId: 'builtin-flux2-klein',
    docsUrl: 'https://huggingface.co/black-forest-labs/FLUX.2-klein-9b-fp8',
    gated: true,
    files: [
      {
        label: 'FLUX.2 Klein 9B fp8',
        category: 'diffusion',
        filename: 'flux-2-klein-9b-fp8.safetensors',
        required: true,
        url: 'https://huggingface.co/black-forest-labs/FLUX.2-klein-9b-fp8/resolve/main/flux-2-klein-9b-fp8.safetensors'
      },
      {
        label: 'Qwen3 8B fp4 mixed',
        category: 'llm',
        filename: 'qwen_3_8b_fp4mixed.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-9b/resolve/main/text_encoders/qwen_3_8b_fp4mixed.safetensors'
      },
      {
        label: 'FLUX.2 VAE',
        category: 'vae',
        filename: 'flux2-vae.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-9b/resolve/main/vae/flux2-vae.safetensors'
      }
    ]
  },
  {
    id: 'z-image',
    name: 'Z-Image',
    description: 'Z-Image Turbo — 6B Single-Stream DiT, distilled to 8 steps. Photorealistic, bilingual text rendering.',
    presetId: 'builtin-z-image',
    docsUrl: 'https://huggingface.co/Comfy-Org/z_image_turbo',
    files: [
      {
        label: 'Z-Image Turbo bf16',
        category: 'diffusion',
        filename: 'z_image_turbo_bf16.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/diffusion_models/z_image_turbo_bf16.safetensors'
      },
      {
        label: 'Qwen 3 4B fp8 mixed',
        category: 'llm',
        filename: 'qwen_3_4b_fp8_mixed.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors'
      },
      {
        label: 'Z-Image VAE',
        category: 'vae',
        filename: 'ae.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors'
      }
    ]
  },
  {
    id: 'qwen-image',
    name: 'Qwen Image',
    description: 'Qwen Image split workflow with Qwen VAE, Qwen VL LLM, flow shift 3, and flash attention.',
    presetId: 'builtin-qwen-image',
    docsUrl: 'https://github.com/leejet/stable-diffusion.cpp/blob/master/docs/qwen_image.md',
    files: [
      {
        label: 'Qwen Image diffusion GGUF Q8',
        category: 'diffusion',
        filename: 'qwen-image-Q8_0.gguf',
        required: true,
        url: 'https://huggingface.co/QuantStack/Qwen-Image-GGUF/resolve/main/qwen-image-Q8_0.gguf'
      },
      {
        label: 'Qwen2.5-VL 7B LLM GGUF Q8',
        category: 'llm',
        filename: 'Qwen2.5-VL-7B-Instruct-Q8_0.gguf',
        required: true,
        url: 'https://huggingface.co/mradermacher/Qwen2.5-VL-7B-Instruct-GGUF/resolve/main/Qwen2.5-VL-7B-Instruct.Q8_0.gguf'
      },
      {
        label: 'Qwen Image VAE',
        category: 'vae',
        filename: 'qwen_image_vae.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors'
      }
    ]
  },
  {
    id: 'ideogram4',
    name: 'Ideogram4',
    description: 'Ideogram4 needs a main diffusion model, uncond diffusion model, Qwen3-VL LLM, and Flux2 VAE.',
    presetId: 'builtin-ideogram4',
    docsUrl: 'https://huggingface.co/leejet/ideogram-4-GGUF',
    files: [
      {
        label: 'Ideogram4 diffusion Q4_0',
        category: 'diffusion',
        filename: 'ideogram4-Q4_0.gguf',
        required: true,
        url: 'https://huggingface.co/leejet/ideogram-4-GGUF/resolve/main/ideogram4-Q4_0.gguf'
      },
      {
        label: 'Ideogram4 uncond diffusion Q4_0',
        category: 'uncond_diffusion',
        filename: 'ideogram4_uncond-Q4_0.gguf',
        required: true,
        url: 'https://huggingface.co/leejet/ideogram-4-GGUF/resolve/main/ideogram4_uncond-Q4_0.gguf'
      },
      {
        label: 'Qwen3-VL 8B Q4_K_M',
        category: 'llm',
        filename: 'Qwen3-VL-8B-Q4_K_M.gguf',
        required: true,
        url: 'https://huggingface.co/rectangleworm/ideogram-4-gguf/resolve/main/text_encoder/Qwen3-VL-8B-Q4_K_M.gguf'
      },
      {
        label: 'Flux2 VAE',
        category: 'vae',
        filename: 'flux2-vae.safetensors',
        required: true,
        url: 'https://huggingface.co/Comfy-Org/Ideogram-4/resolve/main/vae/flux2-vae.safetensors'
      }
    ]
  }
]

export type StarterPackId = 'sdxl' | 'krea2' | 'flux2-klein-9b'

export const STARTER_PACK_IDS: StarterPackId[] = ['sdxl', 'krea2', 'flux2-klein-9b']

export interface StarterPackMeta {
  sizeGb: number
  minVramGb: number
  blurb: string
  recommended?: boolean
}

export const STARTER_PACK_META: Record<StarterPackId, StarterPackMeta> = {
  sdxl: {
    sizeGb: 7,
    minVramGb: 8,
    blurb: 'The smallest starter pack. Works on most GPUs.'
  },
  krea2: {
    sizeGb: 8,
    minVramGb: 8,
    blurb: 'Fast 8-step generation. Great quality for everyday use.',
    recommended: true
  },
  'flux2-klein-9b': {
    sizeGb: 10,
    minVramGb: 12,
    blurb: 'Ultra-fast 4-step generation. Compact 9B model.'
  }
}
